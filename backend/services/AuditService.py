# services/audit.py
from datetime import datetime
from sqlalchemy.orm import Session
from services.PageSpeedService import PageSpeedService
from db.models.Schemas import AuditResult, AuditRequest, AuditReportResponse, PageSpeedData as SchemaPageSpeedData
from db.models.auditReport import AuditReport
from db.models.project import Project
from db.database import get_db
from fastapi import HTTPException
import traceback

class AuditService:
    def __init__(self):
        self.pagespeed = PageSpeedService()
    
    async def generate_audit(self, request: AuditRequest, db: Session) -> AuditResult:
        try:
            project = db.query(Project).filter(Project.id == request.project_id).first()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            categories = ["performance", "accessibility", "best-practices", "seo", "pwa"]
            mobile_lighthouse = await self.pagespeed.analyze_page(str(project.website_url), "mobile", categories=categories)
            desktop_lighthouse = await self.pagespeed.analyze_page(str(project.website_url), "desktop", categories=categories)

            def extract_summary(lh):
                audits = lh.get('audits', {})
                categories_obj = lh.get('categories', {})
                def safe_int(val):
                    try:
                        return int(val)
                    except Exception:
                        return 0
                def safe_float(val):
                    try:
                        return float(val)
                    except Exception:
                        return 0.0
                score_val = categories_obj.get('performance', {}).get('score', 0)
                if score_val is not None:
                    try:
                        score_val = float(score_val)
                    except Exception:
                        score_val = 0.0
                else:
                    score_val = 0.0
                summary = dict(
                    performance_score=int(round(score_val * 100)),
                    fcp=float(round(safe_float(audits.get('first-contentful-paint', {}).get('numericValue', 0)) / 1000, 2)) if audits.get('first-contentful-paint', {}).get('numericValue') is not None else 0.0,
                    lcp=float(round(safe_float(audits.get('largest-contentful-paint', {}).get('numericValue', 0)) / 1000, 2)) if audits.get('largest-contentful-paint', {}).get('numericValue') is not None else 0.0,
                    cls=float(round(safe_float(audits.get('cumulative-layout-shift', {}).get('numericValue', 0)), 3)) if audits.get('cumulative-layout-shift', {}).get('numericValue') is not None else 0.0,
                    fid=float(round(safe_float(audits.get('max-potential-fid', {}).get('numericValue', 0)), 1)) if audits.get('max-potential-fid', {}).get('numericValue') is not None else 0.0,
                    ttfb=float(round(safe_float(audits.get('server-response-time', {}).get('numericValue', 0)), 1)) if audits.get('server-response-time', {}).get('numericValue') is not None else 0.0,
                    opportunities=[{
                        'title': a.get('title', ''),
                        'description': a.get('description', ''),
                        'savings_ms': a.get('details', {}).get('overallSavingsMs', 0)
                    } for a in audits.values() if a.get('details', {}).get('overallSavingsMs', 0) > 100] if audits else [],
                    diagnostics=[{
                        'title': a.get('title', ''),
                        'description': a.get('description', ''),
                        'score': a.get('score', 0)
                    } for a in audits.values() if a.get('scoreDisplayMode') == 'informative' and a.get('score') is not None] if audits else []
                )
                val = score_val * 100
                if isinstance(val, (int, float)):
                    summary['performance_score'] = int(round(val))
                else:
                    summary['performance_score'] = 0
                for k in ['fcp', 'lcp', 'cls', 'fid', 'ttfb']:
                    v = summary.get(k, 0.0)
                    if not isinstance(v, (int, float)):
                        summary[k] = 0.0
                for k in ['opportunities', 'diagnostics']:
                    if not isinstance(summary[k], list):
                        summary[k] = []
                return summary
            mobile_summary = extract_summary(mobile_lighthouse)
            desktop_summary = extract_summary(desktop_lighthouse)
            mobile_data = SchemaPageSpeedData(**mobile_summary)
            desktop_data = SchemaPageSpeedData(**desktop_summary)
            
            overall_score = self._calculate_overall_score(mobile_data, desktop_data)
            
            recommendations = self._generate_recommendations(mobile_data, desktop_data)
            
            audit_report = AuditReport(
                project_id=project.id,
                audit_type=request.audit_type,
                mobile_performance_score=mobile_data.performance_score,
                desktop_performance_score=desktop_data.performance_score,
                mobile_fcp=mobile_data.fcp,
                mobile_lcp=mobile_data.lcp,
                mobile_cls=mobile_data.cls,
                desktop_fcp=desktop_data.fcp,
                desktop_lcp=desktop_data.lcp,
                desktop_cls=desktop_data.cls,
                overall_score=overall_score,
                pagespeed_data={
                    "mobile": mobile_data.dict(),
                    "desktop": desktop_data.dict()
                },
                recommendations=recommendations,
                audit_date_start=datetime.now(),
                audit_date_end=datetime.now()
            )
            
            db.add(audit_report)
            db.commit()
            db.refresh(audit_report)
            
            return AuditResult(
                url=str(project.website_url),
                timestamp=datetime.now(),
                pagespeed_mobile=mobile_data,
                pagespeed_desktop=desktop_data,
                overall_score=overall_score,
                recommendations=recommendations,
                lighthouse_mobile=mobile_lighthouse,
                lighthouse_desktop=desktop_lighthouse
            )
        except HTTPException:
            raise
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    
    def get_audit_history(self, project_id: int, db: Session) -> list[AuditReportResponse]:
        audits = db.query(AuditReport).filter(
            AuditReport.project_id == project_id
        ).order_by(AuditReport.created_at.desc()).all()
        
        return [AuditReportResponse.from_orm(audit) for audit in audits]
    
    def _calculate_overall_score(self, mobile_data, desktop_data) -> int:
        mobile_weight = 0.6
        desktop_weight = 0.4
        overall = (
            mobile_data.performance_score * mobile_weight +
            desktop_data.performance_score * desktop_weight
        )
        return int(overall)
    
    def _generate_recommendations(self, mobile_data, desktop_data) -> list:
        recommendations = []
        if mobile_data.performance_score < 50:
            recommendations.append("Critical: Mobile performance needs immediate attention")
        if mobile_data.lcp > 4.0:
            recommendations.append("Optimize Largest Contentful Paint (LCP) - currently too slow")
        if mobile_data.cls > 0.25:
            recommendations.append("Fix Cumulative Layout Shift (CLS) issues for better user experience")
        if mobile_data.fcp > 3.0:
            recommendations.append("Improve First Contentful Paint (FCP) loading time")
        if desktop_data.performance_score < 50:
            recommendations.append("Critical: Desktop performance needs immediate attention")
        if desktop_data.lcp > 4.0:
            recommendations.append("Optimize Desktop Largest Contentful Paint (LCP) - currently too slow")
        if desktop_data.cls > 0.25:
            recommendations.append("Fix Desktop Cumulative Layout Shift (CLS) issues for better user experience")
        if desktop_data.fcp > 3.0:
            recommendations.append("Improve Desktop First Contentful Paint (FCP) loading time")
        return recommendations[:10]