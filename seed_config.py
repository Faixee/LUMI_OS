from backend.database import SessionLocal
from backend import models
from datetime import datetime

def seed_school_config():
    db = SessionLocal()
    try:
        # Check if config exists
        config = db.query(models.SchoolConfig).filter(models.SchoolConfig.school_id == 'default').first()
        if not config:
            print("Creating default school config...")
            config = models.SchoolConfig(
                school_id='default',
                name="LumiX Academy",
                motto="Inspired Learning. Bold Futures.",
                primary_color="#06b6d4",
                secondary_color="#6366f1",
                security_level="standard",
                ai_creativity=50,
                ai_enabled=True,
                updated_at=datetime.utcnow()
            )
            db.add(config)
        else:
            print("Updating default school config...")
            config.name = "LumiX Academy"
            config.motto = "Inspired Learning. Bold Futures."
            config.updated_at = datetime.utcnow()
        
        db.commit()
        print("School config seeded successfully!")
    except Exception as e:
        print(f"Error seeding school config: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_school_config()
