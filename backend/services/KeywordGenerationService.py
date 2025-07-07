import os
import logging
from typing import Dict, Any, Generator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class KeywordGenerationService:
    @staticmethod
    def generate_advanced_keywords(seed: str, lang: str = 'en', country: str = 'us', top_n: int = 10) -> Dict[str, Any]:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            logger.error("[KeywordGen] GOOGLE_API_KEY not found, cannot run LLM workflow.")
            return {"keywords": [], "metadata": {}, "ranking": [], "llm_metrics": []}
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)

        # Prompt templates
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
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"keyword\": \"social media marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}}\n]\n"
                "Do not include any other fields or explanations."
            ))
        ])
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
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"keyword\": \"social media marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}}\n]\n"
                "Do not include any other fields or explanations.\n"
                "Here is the list:\n{keywords}"
            ))
        ])
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
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"keyword\": \"social media marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}}\n]\n"
                "Seed keyword: {seed_keyword}\nJSON array:\n{keywords}"
            ))
        ])
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

        def parse_seed_analysis(output: str) -> Dict[str, Any]:
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

        def parse_json_array(output: str):
            import json, re
            if isinstance(output, list):
                output = '\n'.join(str(x) for x in output)
            try:
                match = re.search(r'\[.*\]', output, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
                return json.loads(output)
            except Exception:
                return []

        seed_analyzer_chain = seed_analyzer_prompt | llm | RunnableLambda(lambda x: x.content)
        keyword_expander_chain = keyword_expander_prompt | llm | RunnableLambda(lambda x: x.content)
        metric_estimator_chain = metric_estimator_prompt | llm | RunnableLambda(lambda x: x.content)
        filter_prioritizer_chain = filter_prioritizer_prompt | llm | RunnableLambda(lambda x: x.content)
        cluster_dedup_chain = cluster_dedup_prompt | llm | RunnableLambda(lambda x: x.content)
        final_qa_chain = final_qa_prompt | llm | RunnableLambda(lambda x: x.content)

        print("[KeywordGen] Step 1: Running Seed Analyzer...")
        seed_analysis = seed_analyzer_chain.invoke({"seed_keyword": seed})
        print("[KeywordGen] Step 1 complete.")
        logger.info(f"[KeywordGen] Seed Analyzer output: {seed_analysis}")
        parsed_seed = parse_seed_analysis(seed_analysis)
        print("[KeywordGen] Step 2: Running Keyword Expander...")
        expander_input = {
            'intent': parsed_seed['intent'],
            'subtopics': ', '.join(parsed_seed['subtopics'])
        }
        keyword_expansion = keyword_expander_chain.invoke(expander_input)
        print("[KeywordGen] Step 2 complete.")
        logger.info(f"[KeywordGen] Keyword Expander output: {keyword_expansion}")
        if isinstance(keyword_expansion, list):
            keyword_expansion = '\n'.join(str(x) for x in keyword_expansion)
        keywords = []
        for line in keyword_expansion.splitlines():
            if ':' in line:
                kw = line.split(':', 1)[0].strip()
                if kw:
                    keywords.append(kw)
        print("[KeywordGen] Step 3: Running Metric Estimator...")
        metric_input = '\n'.join(keywords)
        metrics_output = metric_estimator_chain.invoke({"keywords": metric_input})
        print("[KeywordGen] Step 3 complete.")
        logger.info(f"[KeywordGen] Metric Estimator output: {metrics_output}")
        metrics = parse_json_array(metrics_output)
        print("[KeywordGen] Step 4: Running Filter & Prioritizer...")
        import json
        filter_input = json.dumps(metrics, ensure_ascii=False)
        filtered_output = filter_prioritizer_chain.invoke({"keywords": filter_input, "seed_keyword": seed})
        print("[KeywordGen] Step 4 complete.")
        logger.info(f"[KeywordGen] Filter & Prioritizer output: {filtered_output}")
        filtered = parse_json_array(filtered_output)
        print("[KeywordGen] Step 5: Running Cluster & Deduplicate...")
        cluster_input = json.dumps(filtered, ensure_ascii=False)
        cluster_output = cluster_dedup_chain.invoke({"keywords": cluster_input, "seed_keyword": seed})
        print("[KeywordGen] Step 5 complete.")
        logger.info(f"[KeywordGen] Cluster & Deduplicate output: {cluster_output}")
        clustered = parse_json_array(cluster_output)
        print("[KeywordGen] Step 6: Running Final QA & Formatting...")
        final_input = json.dumps(clustered, ensure_ascii=False)
        final_output = final_qa_chain.invoke({"keywords": final_input, "seed_keyword": seed})
        print("[KeywordGen] Step 6 complete.")
        logger.info(f"[KeywordGen] Final QA output: {final_output}")
        final_keywords = parse_json_array(final_output)

        keywords_out = []
        for k in final_keywords:
            keywords_out.append({
                "id": str(uuid.uuid4()),
                "keyword": k.get("keyword", ""),
                "search_volume": k.get("search_volume", ""),
                "keyword_difficulty": k.get("keyword_difficulty", ""),
                "competitive_density": k.get("competitive_density", ""),
                "intent": k.get("intent", "")
            })
        print(f"[KeywordGen] Workflow complete. {len(keywords_out)} keywords generated.")
        metadata = {
            "query": seed,
            "country": country,
            "language": lang,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_results": len(keywords_out)
        }
        logger.info(f"[KeywordGen] Returning {len(keywords_out)} keywords with metadata: {metadata}")
        return {
            "keywords": keywords_out,
            "metadata": metadata,
            "ranking": [],
            "llm_metrics": []
        }

    @staticmethod
    def generate_advanced_keywords_stream(seed: str, lang: str = 'en', country: str = 'us', top_n: int = 10) -> Generator[str, None, None]:
        """
        Generator version for SSE streaming. Yields JSON strings with progress updates.
        """
        import json

        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            yield json.dumps({"event": "error", "message": "GOOGLE_API_KEY not found, cannot run LLM workflow."})
            return

        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)

        # Prompt templates
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
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"keyword\": \"social media marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}}\n]\n"
                "Do not include any other fields or explanations."
            ))
        ])
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
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"keyword\": \"social media marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}}\n]\n"
                "Do not include any other fields or explanations.\n"
                "Here is the list:\n{keywords}"
            ))
        ])
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
                "[\n  {{\"keyword\": \"marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}},\n  {{\"keyword\": \"social media marketing\", \"search_volume\": \"medium\", \"keyword_difficulty\": \"high\", \"competitive_density\": \"high\", \"intent\": \"informational\"}}\n]\n"
                "Seed keyword: {seed_keyword}\nJSON array:\n{keywords}"
            ))
        ])
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

        def parse_seed_analysis(output: str) -> Dict[str, Any]:
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

        def parse_json_array(output: str):
            import json, re
            if isinstance(output, list):
                output = '\n'.join(str(x) for x in output)
            try:
                match = re.search(r'\[.*\]', output, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
                return json.loads(output)
            except Exception:
                return []

        seed_analyzer_chain = seed_analyzer_prompt | llm | RunnableLambda(lambda x: x.content)
        keyword_expander_chain = keyword_expander_prompt | llm | RunnableLambda(lambda x: x.content)
        metric_estimator_chain = metric_estimator_prompt | llm | RunnableLambda(lambda x: x.content)
        filter_prioritizer_chain = filter_prioritizer_prompt | llm | RunnableLambda(lambda x: x.content)
        cluster_dedup_chain = cluster_dedup_prompt | llm | RunnableLambda(lambda x: x.content)
        final_qa_chain = final_qa_prompt | llm | RunnableLambda(lambda x: x.content)

        # --- Step 1: Seed Analyzer ---
        yield json.dumps({"event": "progress", "step": 1, "message": "Running Seed Analyzer..."})
        seed_analyzer_chain = seed_analyzer_prompt | llm | RunnableLambda(lambda x: x.content)
        seed_analysis = seed_analyzer_chain.invoke({"seed_keyword": seed})
        parsed_seed = parse_seed_analysis(seed_analysis)
        yield json.dumps({"event": "progress", "step": 1, "message": "Seed Analyzer complete.", "data": parsed_seed})

        # --- Step 2: Keyword Expander ---
        yield json.dumps({"event": "progress", "step": 2, "message": "Running Keyword Expander..."})
        expander_input = {
            'intent': parsed_seed['intent'],
            'subtopics': ', '.join(parsed_seed['subtopics'])
        }
        keyword_expansion = keyword_expander_chain.invoke(expander_input)
        yield json.dumps({"event": "progress", "step": 2, "message": "Keyword Expander complete."})

        # --- Step 3: Metric Estimator ---
        yield json.dumps({"event": "progress", "step": 3, "message": "Running Metric Estimator..."})
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
        yield json.dumps({"event": "progress", "step": 3, "message": "Metric Estimator complete."})

        # --- Step 4: Filter & Prioritizer ---
        yield json.dumps({"event": "progress", "step": 4, "message": "Running Filter & Prioritizer..."})
        import json as _json
        metrics = parse_json_array(metrics_output)
        filter_input = _json.dumps(metrics, ensure_ascii=False)
        filtered_output = filter_prioritizer_chain.invoke({"keywords": filter_input, "seed_keyword": seed})
        yield json.dumps({"event": "progress", "step": 4, "message": "Filter & Prioritizer complete."})

        # --- Step 5: Cluster & Deduplicate ---
        yield json.dumps({"event": "progress", "step": 5, "message": "Running Cluster & Deduplicate..."})
        filtered = parse_json_array(filtered_output)
        cluster_input = _json.dumps(filtered, ensure_ascii=False)
        cluster_output = cluster_dedup_chain.invoke({"keywords": cluster_input, "seed_keyword": seed})
        yield json.dumps({"event": "progress", "step": 5, "message": "Cluster & Deduplicate complete."})

        # --- Step 6: Final QA & Formatting ---
        yield json.dumps({"event": "progress", "step": 6, "message": "Running Final QA & Formatting..."})
        clustered = parse_json_array(cluster_output)
        final_input = _json.dumps(clustered, ensure_ascii=False)
        final_output = final_qa_chain.invoke({"keywords": final_input, "seed_keyword": seed})
        yield json.dumps({"event": "progress", "step": 6, "message": "Final QA complete."})

        # --- Final Output ---
        final_keywords = parse_json_array(final_output)
        keywords_out = []
        for k in final_keywords:
            keywords_out.append({
                "id": str(uuid.uuid4()),
                "keyword": k.get("keyword", ""),
                "search_volume": k.get("search_volume", ""),
                "keyword_difficulty": k.get("keyword_difficulty", ""),
                "competitive_density": k.get("competitive_density", ""),
                "intent": k.get("intent", "")
            })
        metadata = {
            "query": seed,
            "country": country,
            "language": lang,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_results": len(keywords_out)
        }
        yield json.dumps({
            "event": "complete",
            "keywords": keywords_out,
            "metadata": metadata,
            "ranking": [],
            "llm_metrics": []
        }) 