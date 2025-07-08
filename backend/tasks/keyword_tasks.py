from celery_app import celery_app
from db.database import SessionLocal
from services.KeywordGenerationService import KeywordGenerationService
from db.models.Schemas import KeywordSuggestionRequest
import traceback
import os
import json

@celery_app.task(bind=True)
def generate_keyword_suggestions_task(self, request_dict, user_id):
    print('generate_keyword_suggestions_task CALLED')
    db = SessionLocal()
    try:
        request = KeywordSuggestionRequest(**request_dict)
        current = 0
        total = 6  # Number of steps in the LLM chain
        def progress(step, message):
            self.update_state(state="PROGRESS", meta={"current": step, "total": total, "status": message})
        progress(1, "Running Seed Analyzer...")
        # Step 1: Seed Analyzer
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise Exception("GOOGLE_API_KEY not found, cannot run LLM workflow.")
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.runnables import RunnableLambda
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        seed_analyzer_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are \"SeedAnalyzer,\" an expert SEO strategist."),
            ("user", (
                "Please analyze the intent and context behind the seed keyword: \"{seed_keyword}\".\n"
                "Focus on the most relevant, trending, and SEO-optimized search topics that are closely related to the seed.\n"
                "All subtopics must be short (1-3 words), highly relevant, and best for SEO.\n"
                "Reject any subtopic that is not short, not highly relevant, or not SEO-optimized.\n"
                "Do not include explanations, rationales, or any extra text.\n"
                "All subtopics must be suitable for real-world SEO campaigns.\n"
                "Output:\n"
                "1. Primary intent (informational/commercial/navigational).\n"
                "2. Top 3 highly related, trending subtopics or angles (avoid generic or off-topic ideas).\n"
                "3. Suggested geographic or audience modifiers (if any)."
            ))
        ])
        seed_analyzer_chain = seed_analyzer_prompt | llm | RunnableLambda(lambda x: x.content)
        seed_analysis = seed_analyzer_chain.invoke({"seed_keyword": request.seed})
        progress(2, "Seed Analyzer complete. Running Keyword Expander...")
        # Step 2: Keyword Expander
        def parse_seed_analysis(output: str):
            import re
            intent = None
            subtopics = []
            modifiers = []
            if isinstance(output, list):
                output = '\n'.join(str(x) for x in output)
            lines = output.splitlines()
            for line in lines:
                if 'intent' in line.lower():
                    intent = re.sub(r'[^a-zA-Z]', '', line.split(':')[-1]).strip().capitalize()
                elif 'subtopic' in line.lower() or 'angle' in line.lower():
                    subtopics = [s.strip() for s in re.split(r'[,;]', line.split(':')[-1]) if s.strip()]
                elif 'modifier' in line.lower():
                    modifiers = [m.strip() for m in re.split(r'[,;]', line.split(':')[-1]) if m.strip()]
            return {
                'intent': intent or 'Informational',
                'subtopics': subtopics or [],
                'modifiers': modifiers or []
            }
        parsed_seed = parse_seed_analysis(seed_analysis)
        keyword_expander_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are \"KeywordExpander,\" a creative SEO keyword researcher."),
            ("user", (
                "Based on intent {intent} and subtopics {subtopics}, generate 50 keyword ideas.\n"
                "Each keyword must be short (1-3 words), highly relevant to the seed, best for SEO (high search intent, trending, and commonly searched).\n"
                "Reject any keyword that is not short, not highly relevant, or not SEO-optimized.\n"
                "Do not include generic, broad, or unrelated terms.\n"
                "Do not include explanations, rationales, or any extra text.\n"
                "All keywords must be suitable for real-world SEO campaigns.\n"
                "For each, include only the following fields in your output: keyword, search_volume, keyword_difficulty, competitive_density, intent.\n"
                "The values for search_volume, keyword_difficulty, and competitive_density must be one of: 'very high', 'high', 'medium', 'low', 'very low'.\n"
                "The value for intent must be one of: 'informational', 'commercial', or 'navigational'.\n"
                "Output as a JSON array, e.g.:\n"
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"social media marketing\", ...}}\n]\n"
                "Do not include any other fields or explanations."
            ))
        ])
        keyword_expander_chain = keyword_expander_prompt | llm | RunnableLambda(lambda x: x.content)
        expander_input = {
            'intent': parsed_seed['intent'],
            'subtopics': ', '.join(parsed_seed['subtopics'])
        }
        keyword_expansion = keyword_expander_chain.invoke(expander_input)
        progress(3, "Keyword Expander complete. Running Metric Estimator...")
        # Step 3: Metric Estimator
        metric_estimator_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are \"MetricEstimator,\" an SEO analyst using industry benchmarks."),
            ("user", (
                "For each keyword in the JSON array below, estimate and output only the following fields: keyword, search_volume, keyword_difficulty, competitive_density, intent.\n"
                "All keywords must be short (1-3 words), highly relevant, and best for SEO.\n"
                "Reject any keyword that is not short, not highly relevant, or not SEO-optimized.\n"
                "Do not include explanations, rationales, or any extra text.\n"
                "All keywords must be suitable for real-world SEO campaigns.\n"
                "The values for search_volume, keyword_difficulty, and competitive_density must be one of: 'very high', 'high', 'medium', 'low', 'very low'.\n"
                "The value for intent must be one of: 'informational', 'commercial', or 'navigational'.\n"
                "Output as a JSON array, e.g.:\n"
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"social media marketing\", ...}}\n]\n"
                "Do not include any other fields or explanations.\n"
                "Here is the list:\n{keywords}"
            ))
        ])
        metric_estimator_chain = metric_estimator_prompt | llm | RunnableLambda(lambda x: x.content)
        if isinstance(keyword_expansion, list):
            keyword_expansion = '\n'.join(str(x) for x in keyword_expansion)
        keywords = []
        for line in keyword_expansion.splitlines():
            if ':' in line:
                kw = line.split(':', 1)[0].strip()
                if kw:
                    keywords.append(kw)
        metric_input = '\n'.join(keywords)
        metrics_output = metric_estimator_chain.invoke({"keywords": metric_input})
        progress(4, "Metric Estimator complete. Running Filter & Prioritizer...")
        # Step 4: Filter & Prioritizer
        filter_prioritizer_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are \"FilterPrioritizer,\" a data-driven SEO optimizer."),
            ("user", (
                "From the JSON array below, rank keywords by relevance and SEO potential.\n"
                "Return the top 20 keywords, each as an object with only the following fields: keyword, search_volume, keyword_difficulty, competitive_density, intent.\n"
                "All keywords must be short (1-3 words), highly relevant, and best for SEO.\n"
                "Reject any keyword that is not short, not highly relevant, or not SEO-optimized.\n"
                "Do not include explanations, rationales, or any extra text.\n"
                "All keywords must be suitable for real-world SEO campaigns.\n"
                "The values for search_volume, keyword_difficulty, and competitive_density must be one of: 'very high', 'high', 'medium', 'low', 'very low'.\n"
                "The value for intent must be one of: 'informational', 'commercial', or 'navigational'.\n"
                "Output as a JSON array, e.g.:\n"
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"social media marketing\", ...}}\n]\n"
                "Seed keyword: {seed_keyword}\nJSON array:\n{keywords}"
            ))
        ])
        filter_prioritizer_chain = filter_prioritizer_prompt | llm | RunnableLambda(lambda x: x.content)
        import json as _json
        metrics = []
        try:
            match = __import__('re').search(r'\[.*\]', metrics_output, __import__('re').DOTALL)
            if match:
                metrics = json.loads(match.group(0))
            else:
                metrics = json.loads(metrics_output)
        except Exception:
            metrics = []
        filter_input = _json.dumps(metrics, ensure_ascii=False)
        filtered_output = filter_prioritizer_chain.invoke({"keywords": filter_input, "seed_keyword": request.seed})
        progress(5, "Filter & Prioritizer complete. Running Cluster & Deduplicate...")
        # Step 5: Cluster & Deduplicate
        cluster_dedup_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are \"ClusterDeduplicator,\" an SEO grouping specialist."),
            ("user", (
                "Cluster these top 20 keywords by semantic similarity,\n"
                "then for each cluster choose one representative with the highest score and closest relation to the seed keyword.\n"
                "You must output at least 10 unique keywords. If there are not enough clusters, select the next most relevant keywords to reach 10.\n"
                "Output 10 or more finalists as a JSON array, each with only the following fields: keyword, search_volume, keyword_difficulty, competitive_density, intent.\n"
                "All keywords must be short (1-3 words), highly relevant, and best for SEO.\n"
                "Reject any keyword that is not short, not highly relevant, or not SEO-optimized.\n"
                "Do not include explanations, rationales, or any extra text.\n"
                "All keywords must be suitable for real-world SEO campaigns.\n"
                "The values for search_volume, keyword_difficulty, and competitive_density must be one of: 'very high', 'high', 'medium', 'low', 'very low'.\n"
                "The value for intent must be one of: 'informational', 'commercial', or 'navigational'.\n"
                "Seed keyword: {seed_keyword}\nJSON array:\n{keywords}"
                "Do not include any other fields or explanations."
            ))
        ])
        cluster_dedup_chain = cluster_dedup_prompt | llm | RunnableLambda(lambda x: x.content)
        filtered = []
        try:
            match = __import__('re').search(r'\[.*\]', filtered_output, __import__('re').DOTALL)
            if match:
                filtered = json.loads(match.group(0))
            else:
                filtered = json.loads(filtered_output)
        except Exception:
            filtered = []
        cluster_input = _json.dumps(filtered, ensure_ascii=False)
        cluster_output = cluster_dedup_chain.invoke({"keywords": cluster_input, "seed_keyword": request.seed})
        progress(6, "Cluster & Deduplicate complete. Running Final QA & Formatting...")
        # Step 6: Final QA & Formatting
        final_qa_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are \"QAEditor,\" an SEO perfectionist."),
            ("user", (
                "Review the finalists below for the seed keyword: {seed_keyword}\n{keywords}\n"
                "1. Ensure at least 3 informational and 3 commercial keywords.\n"
                "2. Verify no blatant duplicates.\n"
                "3. Ensure all keywords are short (1-3 words), trending, and highly relevant to the seed keyword.\n"
                "4. All keywords must be best for SEO and suitable for real-world SEO campaigns.\n"
                "5. Reject any keyword that is not short, not highly relevant, or not SEO-optimized.\n"
                "6. If there are fewer than 10 keywords, add more from the previous list to ensure at least 10 are present. All must be unique, short, and highly relevant.\n"
                "7. Do not include explanations, rationales, or any extra text.\n"
                "8. Output as a JSON array, each with only the following fields: keyword, search_volume, keyword_difficulty, competitive_density, intent.\n"
                "The values for search_volume, keyword_difficulty, and competitive_density must be one of: 'very high', 'high', 'medium', 'low', 'very low'.\n"
                "The value for intent must be one of: 'informational', 'commercial', or 'navigational'.\n"
                "Do not include any other fields or explanations."
            ))
        ])
        final_qa_chain = final_qa_prompt | llm | RunnableLambda(lambda x: x.content)
        clustered = []
        try:
            match = __import__('re').search(r'\[.*\]', cluster_output, __import__('re').DOTALL)
            if match:
                clustered = json.loads(match.group(0))
            else:
                clustered = json.loads(cluster_output)
        except Exception:
            clustered = []
        final_input = _json.dumps(clustered, ensure_ascii=False)
        final_output = final_qa_chain.invoke({"keywords": final_input, "seed_keyword": request.seed})
        # Final Output
        try:
            match = __import__('re').search(r'\[.*\]', final_output, __import__('re').DOTALL)
            if match:
                final_keywords = json.loads(match.group(0))
            else:
                final_keywords = json.loads(final_output)
        except Exception:
            final_keywords = []
        keywords_out = []
        import uuid as _uuid
        for k in final_keywords:
            keywords_out.append({
                "id": str(_uuid.uuid4()),
                "keyword": k.get("keyword", ""),
                "search_volume": k.get("search_volume", ""),
                "keyword_difficulty": k.get("keyword_difficulty", ""),
                "competitive_density": k.get("competitive_density", ""),
                "intent": k.get("intent", "")
            })
        metadata = {
            "query": request.seed,
            "country": request.country,
            "language": request.lang,
            "timestamp": __import__('datetime').datetime.utcnow().isoformat() + "Z",
            "total_results": len(keywords_out)
        }
        return {"status": "SUCCESS", "result": {
            "keywords": keywords_out,
            "metadata": metadata,
            "ranking": [],
            "llm_metrics": []
        }, "current": total, "total": total}
    except Exception as e:
        traceback.print_exc()
        return {"status": "FAILURE", "error": str(e)}
    finally:
        db.close() 