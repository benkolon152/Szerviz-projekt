# PCD (Pure Custom Desktops)

Az alkalmazás célja egy komplex informatikai platform biztosítása, ahol a felhasználók nemcsak kész hardvereket vásárolhatnak, hanem egy interaktív PC Builder segítségével összeállíthatják saját gépüket, vagy meghibásodás esetén szervizszolgáltatást igényelhetnek. Az adminisztrátorok és dolgozók számára teljes körű készlet- és felhasználókezelést biztosít a rendszer.

<ins>A publikált weboldal linkje:</ins> [PCD Live Link](https://pcd_pure_custom_desktops.onrender.com)

## A program funkciói:

### 1. **Főoldal és Navigáció:**
- **Hero szekció:** Üdvözlő üzenet és kiemelt ajánlatok.
- **Kiemelt kategóriák:** Gyors elérés a legnépszerűbb alkatrészekhez.
- **Navigációs sáv:** Dinamikus menü, amely a jogosultságok alapján változik (pl. Raktárkészlet és Felhasználók menüpontok csak adminoknak/dolgozóknak).

### 2. **Bolt & PC építő:**
- **Webáruház (Store):** Kategóriák szerinti szűrés (CPU, GPU, RAM stb.) és keresési lehetőség.
- **PC építő:** Modális ablakban választható alkatrészek, összeférhetőségi kategóriák szerint, folyamatos árkalkulációval.
- **Kosárkezelés:** Termékek hozzáadása, törlése és mennyiség módosítása egy oldalról becsúszó (CartDrawer) felületen.

### 3. **Szerviz és Rendelés:**
- **Szerviz (Fix/Repair):** Hibás eszközök bejelentése űrlapon keresztül (eszköz típusa, hiba leírása, elérhetőségek).
- **Rendeléskezelés (Checkout):** Szállítási adatok megadása, korábbi címek automatikus betöltése és rendelés leadása.
- **Rendeléstörténet:** A felhasználó saját profiljában láthatja a korábbi vásárlásait és azok állapotát.

### 4. **Adminisztrációs felület:**
- **Raktárkészlet (Inventory):** Termékek felvitele, szerkesztése, törlése és képfeltöltési lehetőség.
- **Felhasználó Menedzsment:** Felhasználók listázása, szerepkörök (Admin, Employee, User) állítása és fiókok kezelése.

### Képek a weboldalról (Asztali nézet)
![Asztali Home](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493741/HomeDT_oumirl.png)
![Asztali Shop Minden](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493742/ShopDT_all_dab3rf.png)
![Asztali Shop Item](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493740/ShopDT_item_dnkldl.png)
![Asztali Shop Filter](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493741/ShopDT_filter_quazzc.png)
![Asztali Build](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493739/BuildDT_wl6mbi.png)
![Asztali Build Select](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493739/BuildDT_select_atmjn8.png)
![Asztali Shopping Cart](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493738/KosarDT_l9torw.png)
![Asztali Profile](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493736/ProfileDT_zjwvbt.png)
![Asztali Orders](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493736/OrdersDT_uylbsb.png)
![Asztali My Builds](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493736/MybuildsDT_jgyrk8.png)

![Asztali Users (Admin)](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493737/UsersDT_z94qr9.png)
![Asztali Inventory (Admin)](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493737/InventoryDT_npxxoq.png)

---

## Mennyiben más (reszponzív) a kinézet mobilon?
Az alkalmazás az `app.css`-ben definiált Media Query-k segítségével igazodik a kisebb kijelzőkhöz:
- **Navigáció:** 768px szélesség alatt a menüsor eltűnik, és egy **hamburger menü** váltja fel.
- **PC Builder:** Mobilon a gépépítő lábléce (ahol az ár látható) függőleges elrendezést vesz fel a könnyebb olvashatóság érdekében.
- **Grid elrendezés:** A webshop termékkártyái és az admin felület táblázatai mobilon egyoszlopos nézetre váltanak.
- **Űrlapok:** A profil és a checkout oldalak beviteli mezői 100% szélességet vesznek fel, kényelmessé téve a gépelést.

### Képek a mobil nézetről
![Mobil Hamburger Menü](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493735/HomeP_Hambur_bv9gqj.png)
![Mobil Shop Minden](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493740/ShopP_all_osgdka.png)
![Mobil Shop Item](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493739/ShopP_item_drc47y.png)
![Mobil Shop Filter](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493739/ShopP_filter_gzq4ym.png)
![Mobil Build](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493738/BuildP_pkg1ik.png)
![Mobil Build Select](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493738/BuildP_select_ql7wcn.png)
![Mobil Shopping Cart](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493737/KosarP_rjutx7.png)
![Mobil Profile](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493737/ProfileP_vhk8t6.png)
![Mobil Orders](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493736/OrdersP_tauxx6.png)
![Mobil My Builds](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493735/MybuildP_ke5va4.png)

![Mobil Users (Admin)](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493737/UsersP_uj37qx.png)
![Mobil Inventory (Admin)](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493736/InventoryP_dslm7a.png)

![Mobil és Asztali Login](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493735/LoginDTP_o4czue.png)
![Mobil és Asztali Register](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777493734/RegisterDTP_nntgzb.png)

---

## Hogyan tárolja az adatokat?

Az alkalmazás az adatokat egy PostgreSQL relációs adatbázisban tárolja. A rendszer központi eleme a **users** tábla, amelyhez idegen kulcsokkal (FK) kapcsolódnak a felhasználói interakciókat (orders, builds, comments) tároló táblák.

**Főbb táblák és kapcsolatok:**

* **users:** A felhasználók adatait tárolja (id, username, useremail, pw, isemployee, isadmin, pfp, city, postal_code, house_number, phone_number). Ez a tábla szolgál alapul minden más felhasználói tevékenységhez.
* **pc_components:** Egy kiterjedt katalógus, amely az összes választható alkatrészt tartalmazza (kategória, név, ár, specifikációk JSONB formátumban, kép URL).
* **builds:** A felhasználók által összeállított egyedi PC konfigurációkat tárolja. A `user_id` mezőn keresztül kapcsolódik a felhasználóhoz. Az alkatrészek listáját (`components`) és a szolgáltatásokat `JSONB` formátumban tárolja.
* **orders:** A leadott rendeléseket (vásárlás vagy szerviz) rögzíti. Tartalmazza a vevő adatait, a tételeket (`items` JSONB), a végösszeget és a rendelés állapotát. A `user_id` kulccsal kapcsolódik a profilhoz.
* **comments:** A felhasználók visszajelzéseit és véleményeit tárolja, összekötve az író profiljával a `user_id` azonosítón keresztül.
* **prebuilt_pc_bundles:** Az előre összeállított, azonnal megvásárolható számítógépcsomagok adatait és leírásait tárolja.

**Kapcsolati logika:**
A kapcsolatok **egy-a-többhöz (1:N)** típusúak: egyetlen felhasználóhoz több építés, több rendelés és több hozzászólás is tartozhat. Az integritást az adatbázis-szintű idegen kulcs (FK) kényszerek biztosítják, amelyek a `users` tábla elsődleges kulcsára (`id`) mutatnak.

![Adatbázis Kapcsolatok Ábra](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777491268/Adat_tarolas_kapcsolatok_fpdt5d.png)

---

## Fontosabb backend végpontok
<ins>A Github backend repository linkje:</ins> [PC_PROJEKT_BACKEND](https://github.com/benkolon152/Szerviz-projekt/tree/main/prj/src/backend)

### 1. **POST /api/login & /api/register**
- Felhasználói hitelesítés és fiók létrehozása.
  - **Paraméterek:** `username`, `email`, `password`.
  - **Visszatérési érték:** Felhasználói objektum (adatokkal és jogosultságokkal).
  - **Hibakezelés:** 401 (hibás jelszó), 409 (már létező felhasználó).

### 2. **GET & POST /api/inventory**
- A készlet lekérdezése és új termékek hozzáadása.
  - **Paraméterek (POST):** Termék adatok és `base64` kép.
  - **Visszatérési érték:** A mentett termék vagy a teljes lista.
  - **Hibakezelés:** 403 (ha nem admin/dolgozó próbálja módosítani).

### 3. **POST /api/orders**
- Új rendelés rögzítése a kosár tartalma alapján.
  - **Paraméterek:** `userId`, `items` (tömb), `shippingAddress`, `totalPrice`.
  - **Visszatérési érték:** `{ ok: true, orderId: "..." }`.

### 4. **POST /api/repairs**
- Szervizigény leadása.
  - **Paraméterek:** `customerName`, `repairDevice`, `repairIssue`, `phoneNumber`.
  - **Visszatérési érték:** Sikeres rögzítés visszaigazolása.

---

## Hogyan lettek tesztelve a fontosabb elemek?

A tesztelési folyamat során **Vitest** (backend) és **Svelte Testing Library** (frontend) keretrendszereket használtunk az automatizált egység- és integrációs tesztek elvégzéséhez.

### Frontend tesztek
A frontend tesztek során a komponensek viselkedését és a felhasználói felület logikáját ellenőriztük:
- **Navigation Component:** Teszteltük a navigációs linkek megjelenését és a bejelentkezett állapotnak megfelelő legördülő menüket.
- **Login Form:** Ellenőriztük az e-mail formátum validációját és a hibaüzenetek megjelenítését helytelen adatok esetén.
- **PC Builder:** Validáltuk az alkatrészek közötti kompatibilitási ellenőrzést és a végösszeg pontos kiszámítását.
- **Shopping Cart:** Teszteltük a termékek hozzáadását, eltávolítását, a mennyiségek frissítését és az üres kosár állapot kezelését.
- **Saved Builds:** Ellenőriztük a mentett konfigurációk listázását, a dátumformátumokat és a törlés funkciót megerősítő ablakát.

![Frontend Teszt Screenshot](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777491647/Frontend_test_qyi7y6.png)

### Backend tesztek
A backend tesztek az API végpontok megbízhatóságát és a szerveroldali üzleti logikát fedik le:
- **Auth API (/api/register, /api/login):** Teszteltük a sikeres regisztrációt és bejelentkezést, valamint a hiányzó mezők vagy érvénytelen adatok miatti elutasítást.
- **Builds API (/api/builds):** Ellenőriztük az új PC összeállítások mentését érvényes komponens adatokkal.
- **Orders API (/api/orders):** Validáltuk a rendelések létrehozását és ellenőriztük, hogy a végösszeg megegyezik-e a tételek árainak összegével.
- **Inventory Management (/api/inventory):** Teszteltük a jogosultságkezelést (**Admin only**), biztosítva, hogy csak adminisztrátor vehessen fel új készletet, valamint validáltuk, hogy az árak csak pozitív számok lehessenek.

![Backend Teszt Screenshot](https://res.cloudinary.com/dmp0jpdeu/image/upload/v1777491647/Backend_test_x7g5rn.png)