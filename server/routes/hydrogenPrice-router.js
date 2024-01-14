//hydrogenPrice é o objecto que é para subsituir

const express = require("express");

const Items = require("../controllers/hydrogenPrice-ctrl");

const router = express.Router();

router.get("/gethydrogenPrices", Items.getHydrogenPrice);
router.get("/hydrogenPrices", Items.hydrogenPrice);
router.post("/convert-currency", Items.convertUSDtoEUR);
router.post("/energy-price", Items.energyPrice);
router.get("/solar-irradiance", Items.solarIrradiance);
router.post("/objective-function", Items.objectiveFunction);
router.get("/hydrogenPrices-timeseries", Items.getHydrogenPriceTimeSeries);
router.get("/hydrogenPrices-prediction", Items.hyrogenPricesPrediction);
router.get("/main", Items.mainFunction);

module.exports = router;
