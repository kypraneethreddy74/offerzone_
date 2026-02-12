"""
Admin Dashboard API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from datetime import datetime, timedelta, timezone
from typing import Dict
import subprocess
import sys
import os
import threading
import time

from db import get_db
from models import User, Wishlist, PriceAlert, AlertNotification, UserRole
from auth.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


# ============================================
# SCRAPER JOB TRACKING
# ============================================

scraper_jobs: Dict[str, dict] = {}
job_lock = threading.Lock()


def get_scraper_path():
    """Get the path to Scrapers directory"""
    current_dir = os.path.dirname(os.path.abspath(__file__))  # admin/
    backend_dir = os.path.dirname(current_dir)                 # backend/
    ecommerce_scraper = os.path.dirname(backend_dir)           # ecommerce-scraper/
    offerzone_root = os.path.dirname(ecommerce_scraper)        # OFFERZONE/
    return os.path.join(offerzone_root, "Scrapers")


def get_etl_path():
    """Get the path to ETL directory"""
    return os.path.join(get_scraper_path(), "etl")


@router.get("/scrapers/job/{job_id}/full")
async def get_job_full_details(
    job_id: str,
    current_user: User = Depends(require_admin)
):
    """Get full details of a specific job including complete error message"""
    with job_lock:
        if job_id in scraper_jobs:
            job = scraper_jobs[job_id]
            return {
                "job_id": job_id,
                "status": job.get("status"),
                "script": job.get("script"),
                "started_at": job.get("started_at"),
                "completed_at": job.get("completed_at"),
                "full_error": job.get("error"),  # Full error message
                "full_output": job.get("output"),  # Full output
                "stage": job.get("stage")
            }
    raise HTTPException(status_code=404, detail="Job not found")

def run_script_async(job_id: str, script_path: str, script_name: str):
    """Run a script asynchronously and track its status"""
    with job_lock:
        scraper_jobs[job_id] = {
            "status": "running",
            "script": script_name,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "error": None,
            "output": ""
        }
    
    try:
        print(f"[SCRAPER] Starting: {script_path}")
        print(f"[SCRAPER] Working dir: {os.path.dirname(script_path)}")
        print(f"[SCRAPER] Python: {sys.executable}")
        
        # Set UTF-8 encoding for Windows compatibility
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        
        # Run with UTF-8 encoding
        process = subprocess.Popen(
            [sys.executable, script_path],
            cwd=os.path.dirname(script_path),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='replace',  # Replace unencodable characters
            env=env
        )
        
        # Wait for completion with timeout (30 minutes)
        stdout, stderr = process.communicate(timeout=1800)
        
        print(f"[SCRAPER] Return code: {process.returncode}")
        if stdout:
            print(f"[SCRAPER] STDOUT (last 500 chars): {stdout[-500:]}")
        if stderr:
            print(f"[SCRAPER] STDERR (last 500 chars): {stderr[-500:]}")
        
        with job_lock:
            if process.returncode == 0:
                scraper_jobs[job_id]["status"] = "completed"
                scraper_jobs[job_id]["output"] = stdout[-2000:] if stdout else "Success"
            else:
                scraper_jobs[job_id]["status"] = "failed"
                error_msg = stderr if stderr else stdout if stdout else "Unknown error"
                scraper_jobs[job_id]["error"] = error_msg[-2000:]
            scraper_jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
            
    except subprocess.TimeoutExpired:
        process.kill()
        with job_lock:
            scraper_jobs[job_id]["status"] = "timeout"
            scraper_jobs[job_id]["error"] = "Script timed out after 30 minutes"
            scraper_jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
    except Exception as e:
        import traceback
        full_error = traceback.format_exc()
        print(f"[SCRAPER] Exception: {full_error}")
        with job_lock:
            scraper_jobs[job_id]["status"] = "failed"
            scraper_jobs[job_id]["error"] = str(e) + "\n" + full_error[-1500:]
            scraper_jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
@router.get("/scrapers/debug-paths")
async def debug_scraper_paths(
    current_user: User = Depends(require_admin)
):
    """Debug endpoint to check scraper paths"""
    scraper_path = get_scraper_path()
    etl_path = get_etl_path()
    
    # Check what files exist
    scraper_files = []
    etl_files = []
    
    if os.path.exists(scraper_path):
        scraper_files = os.listdir(scraper_path)
    
    if os.path.exists(etl_path):
        etl_files = os.listdir(etl_path)
    
    return {
        "scraper_path": scraper_path,
        "scraper_exists": os.path.exists(scraper_path),
        "scraper_files": scraper_files,
        "etl_path": etl_path,
        "etl_exists": os.path.exists(etl_path),
        "etl_files": etl_files,
        "run_scrapers_exists": os.path.exists(os.path.join(scraper_path, "run_scrapers.py")),
        "run_etl_exists": os.path.exists(os.path.join(etl_path, "run_etl.py")),
        "python_executable": sys.executable
    }

# ============================================
# DASHBOARD OVERVIEW
# ============================================

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get comprehensive admin dashboard stats"""
    
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # User Stats
    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).count()
    
    users_today = db.query(User).filter(
        func.date(User.created_at) == today
    ).count()
    
    users_this_week = db.query(User).filter(
        func.date(User.created_at) >= week_ago
    ).count()
    
    # Wishlist Stats
    total_wishlists = db.query(Wishlist).count()
    users_with_wishlists = db.query(Wishlist.user_id).distinct().count()
    
    # Alert Stats
    total_alerts = db.query(PriceAlert).count()
    active_alerts = db.query(PriceAlert).filter(PriceAlert.is_active == True).count()
    triggered_alerts = db.query(PriceAlert).filter(PriceAlert.is_triggered == True).count()
    
    alerts_triggered_today = db.query(AlertNotification).filter(
        func.date(AlertNotification.created_at) == today
    ).count()
    
    emails_sent_today = db.query(AlertNotification).filter(
        func.date(AlertNotification.email_sent_at) == today,
        AlertNotification.email_sent == True
    ).count()
    
    # Product Stats (from existing tables)
    product_stats = db.execute(text("""
        SELECT 
            COUNT(DISTINCT model_id) as total_products,
            COUNT(DISTINCT brand) as total_brands,
            COUNT(DISTINCT platform) as total_platforms,
            ROUND(AVG(sale_price), 2) as avg_price
        FROM tv_platform_latest_master
        WHERE sale_price > 0
    """)).fetchone()
    
    return {
        "user_metrics": {
            "total_users": total_users,
            "verified_users": verified_users,
            "unverified_users": total_users - verified_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "users_today": users_today,
            "users_this_week": users_this_week,
            "verification_rate": round(verified_users / total_users * 100, 1) if total_users > 0 else 0
        },
        "wishlist_metrics": {
            "total_items": total_wishlists,
            "users_with_wishlists": users_with_wishlists,
            "avg_items_per_user": round(total_wishlists / users_with_wishlists, 1) if users_with_wishlists > 0 else 0
        },
        "alert_metrics": {
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "inactive_alerts": total_alerts - active_alerts,
            "triggered_alerts": triggered_alerts,
            "alerts_triggered_today": alerts_triggered_today,
            "emails_sent_today": emails_sent_today
        },
        "product_metrics": {
            "total_products": product_stats.total_products if product_stats else 0,
            "total_brands": product_stats.total_brands if product_stats else 0,
            "total_platforms": product_stats.total_platforms if product_stats else 0,
            "avg_price": float(product_stats.avg_price) if product_stats and product_stats.avg_price else 0
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ============================================
# USER MANAGEMENT
# ============================================

@router.get("/users")
async def get_users(
    page: int = 1,
    page_size: int = 20,
    search: str = None,
    role: str = None,
    verified: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get paginated list of users"""
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if verified is not None:
        query = query.filter(User.is_verified == verified)
    
    total = query.count()
    
    users = query.order_by(User.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.value,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "wishlist_count": db.query(Wishlist).filter(Wishlist.user_id == u.id).count(),
                "alert_count": db.query(PriceAlert).filter(PriceAlert.user_id == u.id).count()
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    is_active: bool = None,
    is_verified: bool = None,
    role: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user status"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-demotion
    if user.id == current_user.id and role and role != "admin":
        raise HTTPException(status_code=400, detail="Cannot demote yourself")
    
    if is_active is not None:
        user.is_active = is_active
    
    if is_verified is not None:
        user.is_verified = is_verified
        if is_verified:
            user.verified_at = datetime.now(timezone.utc)
    
    if role:
        user.role = UserRole(role)
    
    db.commit()
    
    return {"success": True, "message": "User updated"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a user"""
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"success": True, "message": "User deleted"}


# ============================================
# MOST WISHLISTED PRODUCTS
# ============================================

@router.get("/analytics/most-wishlisted")
async def get_most_wishlisted(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get most wishlisted products"""
    
    result = db.execute(text("""
        SELECT 
            w.model_id,
            COUNT(*) as wishlist_count,
            MIN(p.full_name) as product_name,
            MIN(p.brand) as brand,
            MIN(p.sale_price) as min_price,
            MIN(p.image_url) as image_url
        FROM wishlists w
        LEFT JOIN tv_platform_latest_master p ON w.model_id = p.model_id
        GROUP BY w.model_id
        ORDER BY wishlist_count DESC
        LIMIT :limit
    """), {"limit": limit})
    
    return [
        {
            "model_id": row.model_id,
            "wishlist_count": row.wishlist_count,
            "product_name": row.product_name,
            "brand": row.brand,
            "min_price": float(row.min_price) if row.min_price else None,
            "image_url": row.image_url
        }
        for row in result
    ]


# ============================================
# MOST ALERTED PRODUCTS
# ============================================

@router.get("/analytics/most-alerted")
async def get_most_alerted(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get products with most price alerts"""
    
    result = db.execute(text("""
        SELECT 
            a.model_id,
            COUNT(*) as alert_count,
            SUM(CASE WHEN a.is_active = 1 THEN 1 ELSE 0 END) as active_alerts,
            SUM(CASE WHEN a.is_triggered = 1 THEN 1 ELSE 0 END) as triggered_alerts,
            AVG(a.target_price) as avg_target_price,
            MIN(p.full_name) as product_name,
            MIN(p.brand) as brand,
            MIN(p.sale_price) as current_price
        FROM price_alerts a
        LEFT JOIN tv_platform_latest_master p ON a.model_id = p.model_id
        GROUP BY a.model_id
        ORDER BY alert_count DESC
        LIMIT :limit
    """), {"limit": limit})
    
    return [
        {
            "model_id": row.model_id,
            "alert_count": row.alert_count,
            "active_alerts": row.active_alerts,
            "triggered_alerts": row.triggered_alerts,
            "avg_target_price": float(row.avg_target_price) if row.avg_target_price else None,
            "product_name": row.product_name,
            "brand": row.brand,
            "current_price": float(row.current_price) if row.current_price else None
        }
        for row in result
    ]


# ============================================
# RECENT ALERT NOTIFICATIONS
# ============================================

@router.get("/analytics/recent-notifications")
async def get_recent_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get recent alert notifications"""
    
    result = db.execute(text("""
        SELECT 
            n.id,
            n.model_id,
            n.target_price,
            n.triggered_price,
            n.platform,
            n.email_sent,
            n.created_at,
            u.name as user_name,
            u.email as user_email,
            MIN(p.full_name) as product_name
        FROM alert_notifications n
        JOIN users u ON n.user_id = u.id
        LEFT JOIN tv_platform_latest_master p ON n.model_id = p.model_id
        GROUP BY n.id, n.model_id, n.target_price, n.triggered_price, 
                 n.platform, n.email_sent, n.created_at, u.name, u.email
        ORDER BY n.created_at DESC
        LIMIT :limit
    """), {"limit": limit})
    
    return [
        {
            "id": row.id,
            "model_id": row.model_id,
            "product_name": row.product_name,
            "target_price": float(row.target_price),
            "triggered_price": float(row.triggered_price),
            "platform": row.platform,
            "email_sent": row.email_sent,
            "user_name": row.user_name,
            "user_email": row.user_email,
            "created_at": row.created_at.isoformat() if row.created_at else None
        }
        for row in result
    ]


# ============================================
# USER GROWTH CHART DATA
# ============================================

@router.get("/analytics/user-growth")
async def get_user_growth(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get user registration data for chart"""
    
    result = db.execute(text("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_users,
            SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
    """), {"days": days})
    
    return [
        {
            "date": str(row.date),
            "new_users": row.new_users,
            "verified_users": row.verified_users
        }
        for row in result
    ]


# ============================================
# ALERTS ACTIVITY CHART DATA
# ============================================

@router.get("/analytics/alerts-activity")
async def get_alerts_activity(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get alerts activity data for chart"""
    
    result = db.execute(text("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as notifications_sent,
            SUM(CASE WHEN email_sent = 1 THEN 1 ELSE 0 END) as emails_sent
        FROM alert_notifications
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
    """), {"days": days})
    
    return [
        {
            "date": str(row.date),
            "notifications_sent": row.notifications_sent,
            "emails_sent": row.emails_sent
        }
        for row in result
    ]


# ============================================
# RUN ALERT ENGINE MANUALLY
# ============================================

@router.post("/run-alert-engine")
async def run_alert_engine_manual(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Manually trigger alert engine run"""
    
    from alert_engine import AlertEngine
    
    try:
        engine = AlertEngine()
        engine.run()
        
        return {
            "success": True,
            "message": "Alert engine completed",
            "results": {
                "alerts_checked": engine.alerts_checked,
                "alerts_triggered": engine.alerts_triggered,
                "emails_sent": engine.emails_sent
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SCRAPER & ETL CONTROL
# ============================================

@router.get("/scrapers/status")
async def get_scraper_status(
    current_user: User = Depends(require_admin)
):
    """Get status of all scraper jobs"""
    with job_lock:
        return {
            "jobs": dict(scraper_jobs),
            "scraper_path": get_scraper_path(),
            "etl_path": get_etl_path()
        }


@router.get("/scrapers/job/{job_id}")
async def get_job_status(
    job_id: str,
    current_user: User = Depends(require_admin)
):
    """Get status of a specific job"""
    with job_lock:
        if job_id in scraper_jobs:
            return scraper_jobs[job_id]
    raise HTTPException(status_code=404, detail="Job not found")


@router.post("/scrapers/run/{scraper_name}")
async def run_scraper(
    scraper_name: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin)
):
    """Run a specific scraper"""
    
    # Updated: croma_tv_scraper.py instead of c.py
    scraper_map = {
        "amazon": "amazon_tv_scraper.py",
        "flipkart": "flipkart_tv_scraper.py",
        "croma": "croma_tv_scraper.py",
        "all": "run_scrapers.py"
    }
    
    if scraper_name not in scraper_map:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid scraper. Choose from: {list(scraper_map.keys())}"
        )
    
    script_file = scraper_map[scraper_name]
    script_path = os.path.join(get_scraper_path(), script_file)
    
    if not os.path.exists(script_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Script not found: {script_path}"
        )
    
    # Generate job ID
    job_id = f"{scraper_name}_{int(time.time())}"
    
    # Check if same scraper is already running
    with job_lock:
        for jid, job in scraper_jobs.items():
            if job["script"] == script_file and job["status"] == "running":
                raise HTTPException(
                    status_code=409, 
                    detail=f"{scraper_name} scraper is already running (job: {jid})"
                )
    
    # Run in background thread
    thread = threading.Thread(
        target=run_script_async,
        args=(job_id, script_path, script_file)
    )
    thread.start()
    
    return {
        "success": True,
        "message": f"Started {scraper_name} scraper",
        "job_id": job_id,
        "script": script_file
    }


@router.post("/etl/run")
async def run_etl(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin)
):
    """Run the ETL pipeline"""
    
    script_path = os.path.join(get_etl_path(), "run_etl.py")
    
    if not os.path.exists(script_path):
        raise HTTPException(
            status_code=404, 
            detail=f"ETL script not found: {script_path}"
        )
    
    job_id = f"etl_{int(time.time())}"
    
    # Check if ETL is already running
    with job_lock:
        for jid, job in scraper_jobs.items():
            if "etl" in job["script"].lower() and job["status"] == "running":
                raise HTTPException(
                    status_code=409, 
                    detail=f"ETL is already running (job: {jid})"
                )
    
    # Run in background thread
    thread = threading.Thread(
        target=run_script_async,
        args=(job_id, script_path, "run_etl.py")
    )
    thread.start()
    
    return {
        "success": True,
        "message": "Started ETL pipeline",
        "job_id": job_id
    }

@router.post("/scrapers/run-full-pipeline")
async def run_full_pipeline(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin)
):
    """Run scrapers then ETL (full pipeline)"""
    
    job_id = f"full_pipeline_{int(time.time())}"
    
    def run_full():
        scraper_path = os.path.join(get_scraper_path(), "run_scrapers.py")
        etl_path = os.path.join(get_etl_path(), "run_etl.py")
        
        with job_lock:
            scraper_jobs[job_id] = {
                "status": "running",
                "script": "full_pipeline",
                "stage": "scrapers",
                "started_at": datetime.now(timezone.utc).isoformat(),
                "completed_at": None,
                "error": None,
                "output": ""
            }
        
        # Set UTF-8 encoding for Windows compatibility
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        
        try:
            # Stage 1: Scrapers
            print(f"[FULL PIPELINE] Starting scrapers: {scraper_path}")
            
            process1 = subprocess.Popen(
                [sys.executable, scraper_path],
                cwd=get_scraper_path(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='replace',
                env=env
            )
            stdout1, stderr1 = process1.communicate(timeout=3600)
            
            print(f"[FULL PIPELINE] Scrapers return code: {process1.returncode}")
            
            if process1.returncode != 0:
                error_msg = stderr1 if stderr1 else stdout1 if stdout1 else "Unknown scraper error"
                raise Exception(f"Scrapers failed: {error_msg[-1000:]}")
            
            # Stage 2: ETL
            with job_lock:
                scraper_jobs[job_id]["stage"] = "etl"
                scraper_jobs[job_id]["output"] = stdout1[-1000:] if stdout1 else ""
            
            print(f"[FULL PIPELINE] Starting ETL: {etl_path}")
            
            process2 = subprocess.Popen(
                [sys.executable, etl_path],
                cwd=get_etl_path(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='replace',
                env=env
            )
            stdout2, stderr2 = process2.communicate(timeout=1800)
            
            print(f"[FULL PIPELINE] ETL return code: {process2.returncode}")
            
            if process2.returncode != 0:
                error_msg = stderr2 if stderr2 else stdout2 if stdout2 else "Unknown ETL error"
                raise Exception(f"ETL failed: {error_msg[-1000:]}")
            
            # Success
            with job_lock:
                scraper_jobs[job_id]["status"] = "completed"
                scraper_jobs[job_id]["output"] = "Scrapers + ETL completed successfully"
                scraper_jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
            
            print("[FULL PIPELINE] Completed successfully!")
                
        except subprocess.TimeoutExpired:
            with job_lock:
                scraper_jobs[job_id]["status"] = "timeout"
                scraper_jobs[job_id]["error"] = "Pipeline timed out"
                scraper_jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
        except Exception as e:
            print(f"[FULL PIPELINE] Error: {str(e)}")
            with job_lock:
                scraper_jobs[job_id]["status"] = "failed"
                scraper_jobs[job_id]["error"] = str(e)[-2000:]
                scraper_jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    thread = threading.Thread(target=run_full)
    thread.start()
    
    return {
        "success": True,
        "message": "Started full pipeline (Scrapers → ETL)",
        "job_id": job_id
    }


@router.delete("/scrapers/jobs/clear")
async def clear_completed_jobs(
    current_user: User = Depends(require_admin)
):
    """Clear completed/failed jobs from history"""
    with job_lock:
        to_remove = [
            jid for jid, job in scraper_jobs.items() 
            if job["status"] in ["completed", "failed", "timeout"]
        ]
        for jid in to_remove:
            del scraper_jobs[jid]
    
    return {"success": True, "cleared": len(to_remove)}
    
    
    