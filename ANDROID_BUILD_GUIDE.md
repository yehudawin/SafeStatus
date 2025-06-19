# 🤖 מדריך בניית אפליקציית Android - SafeStatus

## 📋 **דרישות מוקדמות**

### ☕ **התקנת Java JDK**
נדרש Java JDK 11 או גבוה יותר:

#### **Windows:**
1. הורד מ-[Oracle JDK](https://www.oracle.com/java/technologies/downloads/) או [OpenJDK](https://adoptium.net/)
2. התקן והוסף את Java ל-PATH
3. הגדר משתנה סביבה `JAVA_HOME`

#### **בדיקת התקנה:**
```bash
java -version
javac -version
```

### 🛠️ **Android Studio (אופציונלי)**
להתקנה מלאה ובדיקות:
- הורד מ-[Android Studio](https://developer.android.com/studio)
- התקן Android SDK
- הגדר משתנה `ANDROID_HOME`

---

## 🚀 **שלבי הבניה**

### **1. הכנת הפרויקט**
```bash
# וידוא שהכל מעודכן
npm run build
npx cap sync android
```

### **2. בניית APK לבדיקה**
```bash
cd android
.\gradlew.bat assembleRelease
```
**תוצאה:** `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### **3. בניית AAB לGoogle Play Store**
```bash
cd android
.\gradlew.bat bundleRelease
```
**תוצאה:** `android/app/build/outputs/bundle/release/app-release.aab`

### **4. חתימה דיגיטלית (נדרש לחנות)**

#### **יצירת מפתח חתימה:**
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### **חתימת הקובץ:**
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk my-key-alias
zipalign -v 4 app-release-unsigned.apk SafeStatus.apk
```

---

## 🔧 **פתרון בעיות נפוצות**

### **❌ "JAVA_HOME is not set"**
```bash
# Windows PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11.0.x"
$env:PATH += ";$env:JAVA_HOME\bin"
```

### **❌ "Android SDK not found"**
```bash
# הגדרת ANDROID_HOME
$env:ANDROID_HOME = "C:\Users\[USERNAME]\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
```

### **❌ "Gradle build failed"**
```bash
# ניקוי וניסיון מחדש
.\gradlew.bat clean
.\gradlew.bat assembleRelease --stacktrace
```

---

## 📱 **הגדרות לGoogle Play Store**

### **build.gradle עדכונים (אם נדרש):**
```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.safestatus.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### **הרשאות (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 🎯 **קבצים חשובים לחנות**

### **✅ מוכנים:**
- **אייקונים**: `public/icon-*.png` (כל הגדלים)
- **צילומי מסך**: `screenshots/*.png` (4 קבצים)
- **מידע לחנות**: `GOOGLE_PLAY_STORE.md`

### **⚠️ נדרשים לבניה:**
- **Java JDK 11+**
- **Android SDK** (אופציונלי)
- **מפתח חתימה** (לפרסום)

---

## 🌐 **חלופות לבניה מקומית**

### **1. GitHub Actions (מומלץ)**
- יצירת workflow אוטומטי
- בניה בענן ללא התקנות מקומיות
- חתימה אוטומטית

### **2. Expo EAS Build**
- מעבר ל-Expo managed workflow
- בניה מקצועית בענן
- תשלום חודשי

### **3. Capacitor Cloud (עתידי)**
- שירות רשמי של Ionic
- פשוט ומהיר

---

## 📞 **תמיכה**

אם יש בעיות בבניה:
1. **בדוק** שJava מותקן ו-JAVA_HOME מוגדר
2. **נסה** לנקות: `.\gradlew.bat clean`
3. **הפעל** עם --stacktrace לפרטי שגיאה
4. **שקול** להשתמש ב-GitHub Actions לבניה אוטומטית

---

## 🎉 **מה הבא?**

לאחר שיש לך קובץ AAB:
1. **העלה** ל-Google Play Console
2. **מלא** פרטי האפליקציה
3. **הוסף** צילומי מסך
4. **שלח** לאישור

**זמן אישור**: 1-3 ימי עבודה בדרך כלל 