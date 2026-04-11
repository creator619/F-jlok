const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const rateLimit = require("express-rate-limit");

const PORT = 3000;

//= "192.168.0.164";  // a géped IP címe a hálózaton
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 perc
    max: 50, // max 50 request
    message: "Túl sok kérés, próbáld később"
});

const os = require("os");

function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name in interfaces) {
        for (const net of interfaces[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }

    return null;
}

const LOCAL_IP = getLocalIP();

console.log("IP:", LOCAL_IP);

app.get("/config", (req, res) => {
    res.json({
        ip: LOCAL_IP,
        port: 3000
    });
});

app.use(cors({
    origin: `http://${LOCAL_IP}:${PORT}` // frontend címe
}));
app.use(express.json());
app.use("/static", express.static("../frontend"));

// Statikus fájlok kiszolgálása (pl. képek a frontend mappából, ha szükséges, de itt frontend külön van)
// Mivel a frontend a gyökérben van és a backend külön, most csak az API-t csináljuk.

// CORS policy Megmondja, hogy ki híchatja a backendet böngészőből

//app.use(cors({ origin: "http://localhost3000", 'frontend címe }));    

// Routes



app.use("/auth", limiter, require("./routes/auth"));
app.use("/products", limiter, require("./routes/products"));
app.use("/orders", limiter, require("./routes/orders"));
app.use("/contact", limiter, require("./routes/contact"));
app.use("/admin", require("./routes/admin"));
//A képfájlokat a backend statikus kiszolgálással (Express static middleware) szolgálja ki, az adatbázis csak a fáljnevet tárolja
app.use("/images", express.static("./images"));
app.use("/", limiter, require("./routes/pages"))



//GET és POST contact kész (Get adminban van) (FRONTEND RÁKÖTNI)
// GET, POST és PUT categories kész (admin rész) (FRONTEND RÁKÖTNI)
// GET és PUT profile kész (auth rész)
// GET orders/my (KÉSZ) (FRONTEND RÁKÖTNI)

// GET users és profile kész (admin rész3)

//FRONTEND profilban amikor fetch put-oljuk a user cím adatait, nem megfelelően menti el az sql-be. (Frontend rosszul küld adat)
//FRONTEND profilban nem kéri le az adatokat, amit elmentünk sql-ben.

//A termékek száma nem frissül hiába adunk le rendelést 
//A termékek ára nem backendben számolódik ki == simán hackelhető

// Ha leadunk egy rendelést akkor nem adja hozzá a profilhoz az adatainkat amit felhasználunk (Nincs profile)
// Ha be vagyunk jelentkezve rá tudunk menni al ogin és register oldalra is.


//Nem enged többet be rakni a kosárba, viszont ha a kosárban vagyunk akkor a plusz jelecskével tudunk még hozzáadni (STILL WORKING)
// keress termékre résznél a nagyító bele log a szövegbe.
//keresés funkció a fő oldalon nem működik.
//Visszaküldés a contact oldalra visznek (Ha ez tervezett működés akkor nincs probléma)
//A contact oldalon a kereső nem működik és kicsit bután néz ki

//rendelés leadása után a rendelési azonosító undefined

app.get("/:page", (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(__dirname, `../frontend/html/${page}`));
});

//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.listen(PORT, LOCAL_IP, () => {
    console.log(`Server running on http://${LOCAL_IP}:${PORT}`);
    console.log(path.join(__dirname, "../frontend/html"));
});