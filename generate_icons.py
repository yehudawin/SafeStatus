#!/usr/bin/env python3
"""
SafeStatus Icons Generator
יוצר אייקונים מקצועיים לאפליקציית SafeStatus
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_shield_icon(size):
    """יוצר אייקון מגן עם עיצוב מקצועי"""
    
    # יצירת תמונה חדשה עם רקע שקוף
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # מרכז התמונה
    center = size // 2
    
    # יצירת רקע עגול עם gradient
    circle_size = int(size * 0.9)
    circle_pos = (center - circle_size // 2, center - circle_size // 2,
                  center + circle_size // 2, center + circle_size // 2)
    
    # רקע כהה עם מעט כחול
    draw.ellipse(circle_pos, fill=(31, 41, 55, 255))  # #1f2937 + alpha
    
    # מגן במרכז
    shield_size = int(size * 0.5)
    shield_top = center - shield_size // 2
    shield_bottom = center + shield_size // 2
    shield_left = center - shield_size // 3
    shield_right = center + shield_size // 3
    
    # צורת המגן
    shield_points = [
        (center, shield_top),  # קודקוד עליון
        (shield_right, shield_top + shield_size // 4),  # ימין עליון
        (shield_right, shield_bottom - shield_size // 4),  # ימין תחתון
        (center, shield_bottom),  # קודקוד תחתון
        (shield_left, shield_bottom - shield_size // 4),  # שמאל תחתון
        (shield_left, shield_top + shield_size // 4),  # שמאל עליון
    ]
    
    # מגן ירוק - צבע בטיחות
    draw.polygon(shield_points, fill=(16, 185, 129, 255))  # #10b981
    
    # מגן פנימי לבן
    inner_shield_size = int(shield_size * 0.7)
    inner_top = center - inner_shield_size // 2
    inner_bottom = center + inner_shield_size // 2
    inner_left = center - inner_shield_size // 3
    inner_right = center + inner_shield_size // 3
    
    inner_points = [
        (center, inner_top),
        (inner_right, inner_top + inner_shield_size // 4),
        (inner_right, inner_bottom - inner_shield_size // 4),
        (center, inner_bottom),
        (inner_left, inner_bottom - inner_shield_size // 4),
        (inner_left, inner_top + inner_shield_size // 4),
    ]
    
    draw.polygon(inner_points, fill=(255, 255, 255, 255))
    
    # סימן V (צ'ק) במרכז
    check_size = int(size * 0.15)
    check_thickness = max(2, size // 50)
    
    # נקודות הצ'ק
    check_start = (center - check_size // 2, center)
    check_middle = (center - check_size // 4, center + check_size // 2)
    check_end = (center + check_size // 2, center - check_size // 2)
    
    # ציור הצ'ק
    draw.line([check_start, check_middle], fill=(16, 185, 129, 255), width=check_thickness)
    draw.line([check_middle, check_end], fill=(16, 185, 129, 255), width=check_thickness)
    
    return img

def create_favicon():
    """יוצר favicon פשוט יותר"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # רקע עגול פשוט
    draw.ellipse((2, 2, 30, 30), fill=(31, 41, 55, 255))
    
    # מגן פשוט
    shield_points = [
        (16, 6),   # עליון
        (24, 10),  # ימין עליון
        (24, 20),  # ימין תחתון
        (16, 26),  # תחתון
        (8, 20),   # שמאל תחתון
        (8, 10),   # שמאל עליון
    ]
    
    draw.polygon(shield_points, fill=(16, 185, 129, 255))
    
    # צ'ק קטן
    draw.line([(12, 16), (14, 18)], fill=(255, 255, 255, 255), width=2)
    draw.line([(14, 18), (20, 12)], fill=(255, 255, 255, 255), width=2)
    
    return img

def main():
    """יוצר את כל האייקונים הנדרשים"""
    
    print("🎨 יוצר אייקונים לSafeStatus...")
    
    # יצירת תיקיית public אם לא קיימת
    os.makedirs('public', exist_ok=True)
    
    # יצירת אייקונים בגדלים שונים
    sizes = [512, 192, 180, 96, 72, 48, 32, 16]
    
    for size in sizes:
        print(f"📱 יוצר אייקון {size}x{size}...")
        
        if size == 32 or size == 16:
            # עבור favicon - עיצוב פשוט יותר
            icon = create_favicon()
            if size == 16:
                icon = icon.resize((16, 16), Image.Resampling.LANCZOS)
        else:
            # עבור אייקונים גדולים - עיצוב מפורט
            icon = create_shield_icon(size)
        
        # שמירת האייקון
        filename = f'public/icon-{size}x{size}.png'
        icon.save(filename, 'PNG', optimize=True)
        print(f"✅ נשמר: {filename}")
    
    # יצירת Apple Touch Icon
    apple_icon = create_shield_icon(180)
    apple_icon.save('public/apple-touch-icon.png', 'PNG', optimize=True)
    print("✅ נשמר: public/apple-touch-icon.png")
    
    # יצירת favicon.ico (מרובה גדלים)
    favicon_img = create_favicon()
    favicon_sizes = [16, 32, 48]
    favicon_images = []
    
    for size in favicon_sizes:
        if size == 32:
            favicon_images.append(favicon_img)
        else:
            resized = favicon_img.resize((size, size), Image.Resampling.LANCZOS)
            favicon_images.append(resized)
    
    # שמירת favicon.ico
    favicon_images[0].save(
        'public/favicon.ico',
        format='ICO',
        sizes=[(size, size) for size in favicon_sizes],
        append_images=favicon_images[1:],
    )
    print("✅ נשמר: public/favicon.ico")
    
    print("\n🎉 כל האייקונים נוצרו בהצלחה!")
    print("\n📋 קבצים שנוצרו:")
    for size in sizes:
        print(f"   📱 icon-{size}x{size}.png")
    print("   🍎 apple-touch-icon.png")
    print("   🌐 favicon.ico")
    
    print("\n✅ האייקונים מוכנים לפרסום בחנות גוגל פליי!")

if __name__ == "__main__":
    main() 