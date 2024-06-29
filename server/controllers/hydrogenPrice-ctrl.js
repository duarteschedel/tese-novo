const axios = require("axios");
const { default: mongoose } = require("mongoose");
const solarIrradianceModel = require("../models/solar-irradiance");
const numeric = require("numeric");
const math = require("mathjs");
const ml = require("ml-regression");
const TimeSeries = require("timeseries-analysis");
const tf = require("@tensorflow/tfjs");
var timeseries = require("timeseries-analysis");
var holtWinters = require("holtwinters-md");

//Get hydrogen price from the Global X Hydrogen ETF
getHydrogenPrice = async (req, res) => {
  const data = {};

  console.log(req.body);

  let options = {
    method: "GET",
    url: "https://twelve-data1.p.rapidapi.com/price",
    params: { symbol: "HYDR", format: "json", outputsize: "30" },
    headers: {
      "X-RapidAPI-Key": "ca013ab033mshf7dedb5f131e3a7p1ae97fjsnf5149e3df792",
      "X-RapidAPI-Host": "twelve-data1.p.rapidapi.com",
    },
  };

  await axios
    .request(options)
    .then(function (response) {
      data.hydrogen = response.data;
      axios({
        method: "post",
        url: "http://localhost:4000/api/convert-currency",
        data: {
          amount: data.hydrogen.price,
        },
      }).then((response1) => {
        return res
          .status(200)
          .json({ success: true, data: response1.data.data });
      });
    })
    .catch(function (error) {
      return res.status(400).json({ success: false, message: error });
    });
};

hydrogenPrice = async (req, res) => {
  try {
    let options = {
      method: "GET",
      url: "https://www.spglobal.com/commodityinsights/PlattsContent/_assets/_files/en/specialreports/energy-transition/platts-hydrogen-price-wall/data/hydro_202312.json",
    };

    const response = await axios.request(options);
    const data = response.data;

    console.log(response.data);

    return res.status(200).json({ success: true, response: data });
  } catch (error) {
    return res.status(400).json({ success: false, response: error });
  }
};

getHydrogenPriceTimeSeries = async (req, res) => {
  const options = {
    method: "GET",
    url: "https://twelve-data1.p.rapidapi.com/time_series",
    params: {
      symbol: "HYDR",
      interval: "30min",
      outputsize: "1000",
      format: "json",
    },
    headers: {
      "X-RapidAPI-Key": "ca013ab033mshf7dedb5f131e3a7p1ae97fjsnf5149e3df792",
      "X-RapidAPI-Host": "twelve-data1.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    return res.status(200).json({ sucess: true, data: response.data });
  } catch (error) {
    console.error(error);
  }
};

//Convert Dolars to Euros
convertUSDtoEUR = async (req, res) => {
  const amount = req.body.amount;
  const options = {
    method: "GET",
    url: "https://twelve-data1.p.rapidapi.com/currency_conversion",
    params: { symbol: "USD/EUR", amount: amount },
    headers: {
      "X-RapidAPI-Key": "ca013ab033mshf7dedb5f131e3a7p1ae97fjsnf5149e3df792",
      "X-RapidAPI-Host": "twelve-data1.p.rapidapi.com",
    },
  };

  axios
    .request(options)
    .then(function (response) {
      return res
        .status(200)
        .json({ success: true, data: response.data.amount });
    })
    .catch(function (error) {
      return res.status(400).json({ success: false, message: error });
    });
};

//Get energy information such as price, exports and imports and consumption of portugal and spain
energyPrice = async (req, res) => {
  year = req.body.year;
  month = req.body.month;
  day = req.body.day;

  console.log(req.body);

  const date =
    day + "_" + month + "_" + year + "_" + day + "_" + month + "_" + year;

  console.log(date);

  const url =
    "https://www.omie.es/sites/default/files/dados/AGNO_" +
    year +
    "/MES_" +
    month +
    "/TXT/INT_PBC_EV_H_1_" +
    date +
    ".TXT";

  let array2 = [];
  let array3 = [];

  console.log(url);

  options = {
    method: "GET",
    url: url,
    data: {},
  };

  try {
    await axios.request(options).then((response) => {
      data = JSON.stringify(response.data);
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: "Request to Omi Failed" });
  }

  const array = data.split(";");

  array.forEach((element) => {
    array2.push(parseFloat(element.replace(",", ".")));
  });

  array2.forEach((element) => {
    if (!Number.isNaN(element)) {
      array3.push(element);
    }
  });

  array3.splice(0, 25);

  const marginalPriceOfSpain = array3.splice(0, 24);
  const marginalPriceOfPortugal = array3.splice(0, 24);
  const energyBoughtBySpain = array3.splice(0, 24);
  const energySoldBySpain = array3.splice(0, 24);
  const energyBoughtByPortugal = array3.splice(0, 24);
  const energySoldByPortugal = array3.splice(0, 24);
  const totalEnergyOfIbericPenisula = array3.splice(0, 24);
  const totalEnergyWithBilateralesOfIbericPenisula = array3.splice(0, 24);
  const importsOfSpainFromPortugal = array3.splice(0, 24);
  const exportsOfSpainToPortugal = array3.splice(0, 24);

  const energyInformation = {
    marginalPriceOfSpain: marginalPriceOfSpain, // (EUR/MWh)
    marginalPriceOfPortugal: marginalPriceOfPortugal, // (EUR/MWh)
    energyBoughtBySpain: energyBoughtBySpain, //(MWh)
    energySoldBySpain: energySoldBySpain, //(MWh)
    energyBoughtByPortugal: energyBoughtByPortugal, //(MWh)
    energySoldByPortugal: energySoldByPortugal, //(MWh)
    totalEnergyOfIbericPenisula: totalEnergyOfIbericPenisula, //(MWh)
    totalEnergyWithBilateralesOfIbericPenisula:
      totalEnergyWithBilateralesOfIbericPenisula, //(MWh)
    importsOfSpainFromPortugal: importsOfSpainFromPortugal, //(MWh)
    exportsOfSpainToPortugal: exportsOfSpainToPortugal, //(MWh)
  };
  return res
    .status(200)
    .json({ success: true, energyInformation: energyInformation });
};

solarIrradiance = async (req, res) => {
  //TxGT_xnz10NyryG16spxnWNdWyVVyeq7
  //qRCRFvDlNMwIFc07Ra8MGo5ryGMwhumg
  //MAmpqt5_RGaY0H_5LyKqE0dYxTuh7K9a

  try {
    const options = {
      method: "GET",
      url: "https://solcast.p.rapidapi.com/pv_power/forecasts",
      params: {
        api_key: "MAmpqt5_RGaY0H_5LyKqE0dYxTuh7K9a",
        capacity: req.body.capacity,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        azimuth: req.body.azimuth,
        install_date: req.body.install_date,
        loss_factor: req.body.loss_factor,
        tilt: req.body.tilt,
        format: "json",
      },
      headers: {
        "X-RapidAPI-Key": "ca013ab033mshf7dedb5f131e3a7p1ae97fjsnf5149e3df792",
        "X-RapidAPI-Host": "solcast.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);

    const data = response.data.forecasts;

    return res.status(200).json({ sucess: true, result: data });
  } catch (error) {
    return res.status(400).json({ sucess: false, result: error });
  }

  await solarIrradianceModel
    .find({})
    .then(async (response) => {
      if (
        response[3]?.date?.getTime() + 72000 < Date.now() ||
        response[3]?.date === null ||
        response.length < 4
      ) {
        try {
          await solarIrradianceModel.deleteMany({});
          const response = await axios.request(options);
          const data = response.data;
          try {
            const response = await solarIrradianceModel.insertMany(
              data.forecasts
            );
            return res
              .status(201)
              .json({ success: true, data_output: response });
          } catch (error) {
            return res.status(400).json({ success: false, message: error });
          }
        } catch (error) {
          return res.status(400).json({ success: false, message: error });
        }
      } else {
        return res.status(200).json({ success: true, data_output: response });
      }
    })
    .catch((error) => {
      return res.status(400).json({ success: false, message: error });
    });
};

objectiveFunction = async (req, res) => {
  const { priceEnergy, priceGas, PV, numberOfHours, P_bat_max, P_hydr_max } =
    req.body;

  if (!priceEnergy || !priceGas || !PV || !numberOfHours) {
    return res.status(400).json({ sucess: false, message: "input wrong" });
  }

  if (
    numberOfHours !== priceEnergy.length ||
    numberOfHours !== priceGas.length ||
    numberOfHours !== PV.length
  ) {
    return res.status(400).json({ success: false, message: "input wrongs" });
  }

  const arrayA = createArrayA(numberOfHours, PV);
  const arrayB = createArrayB(numberOfHours, P_bat_max, P_hydr_max, PV);
  const arrayC = createArrayC(numberOfHours, priceEnergy, priceGas);
  const arrayD = createArrayD(numberOfHours);
  const arrayE = createArrayE(numberOfHours, PV);

  // return res.status(200).json({ success: true, data_output: arrayE });

  // console.log("A", arrayA);
  // console.log("B", arrayB);
  // console.log("C", arrayC);
  // console.log("D", arrayD);
  // console.log("E", arrayE);

  var options = {
    maxIterations: 100,
  };

  var lp = numeric.solveLP(arrayC, arrayA, arrayB, arrayD, arrayE, options);

  var solution = numeric.trunc(lp.solution, 1e-12);

  return res.status(200).json(lp);
};

createArrayA = (numberOfHours, PV) => {
  const array = [];
  const numberOfVariables = numberOfHours * 5;

  //xn > 0
  for (let i = 0; i < numberOfVariables; i++) {
    const aux = Array(numberOfVariables).fill(0);
    aux.splice(i, 1, -1);
    array.push(aux);
  }

  //Restringir (Xn+1 - Xn) + (Xn-5+1 - Xn-5) ... < P_max Bateria
  for (let m = 1; m <= numberOfHours; m++) {
    const aux = Array(numberOfVariables).fill(0);
    for (let n = (m - 1) * 5; n >= 0; n = n - 5) {
      aux.splice(n + 1, 1, 1);
      aux.splice(n, 1, -1);
    }
    array.push(aux);
  }

  // Restringir (Xn - Xn+1) + (Xn-5 - Xn-5+1) < 0  --> Certtificar que Xn nao excede a energia disponivel na bateria
  for (let m = 1; m <= numberOfHours; m++) {
    const aux = Array(numberOfVariables).fill(0);
    for (let n = (m - 1) * 5; n >= 0; n = n - 5) {
      aux.splice(n + 1, 1, -1);
      aux.splice(n, 1, 1);
    }
    array.push(aux);
  }

  //Certificar que o Pch_el é menor que a P-max que se pode armazenar de Hydrogen
  for (let m = 1; m <= numberOfHours; m++) {
    const aux = Array(numberOfVariables).fill(0);
    for (let n = (m - 1) * 5 + 3; n >= 0; n = n - 5) {
      aux.splice(n + 1, 1, -1);
      aux.splice(n, 1, 1);
    }
    array.push(aux);
  }

  //Certificar que nao se vende mais hydrogen do que aquele que sem tem
  for (let m = 1; m <= numberOfHours; m++) {
    const aux = Array(numberOfVariables).fill(0);
    for (let n = (m - 1) * 5 + 3; n >= 0; n = n - 5) {
      aux.splice(n + 1, 1, 1);
      aux.splice(n, 1, -1);
    }
    array.push(aux);
  }

  for (let m = 1; m <= numberOfHours; m++) {
    const aux = Array(numberOfVariables).fill(0);
    const n = (m - 1) * 5;

    aux.splice(n, 1, 1);
    aux.splice(n + 1, 1, -1);
    aux.splice(n + 2, 1, 1);
    aux.splice(n + 3, 1, -1);

    array.push(aux);
  }

  //P_ch1 < P_pv1 --> A energia carregada na bateria tem de ser sempre inferior a energia dos paineis solares
  for (let m = 1; m <= numberOfHours; m++) {
    const aux = Array(numberOfVariables).fill(0);
    const n = (m - 1) * 5;

    aux.splice(n + 1, 1, 1);
    aux.splice(n + 2, 1, -1);

    array.push(aux);
  }

  //P__ek_ch1 < P_pv1 --> A energia carregada na bateria tem de ser sempre inferior a energia dos paineis solares
  for (let m = 1; m <= numberOfHours; m++) {
    const aux = Array(numberOfVariables).fill(0);
    const n = (m - 1) * 5;

    aux.splice(n + 3, 1, 1);
    aux.splice(n + 2, 1, -1);

    array.push(aux);
  }

  return array;
};

createArrayB = (numberOfHours, P_bat_max, P_hydr_max, PV) => {
  const numberOfVariables = numberOfHours * 5;
  const array = [];

  for (let i = 0; i < numberOfVariables; i++) {
    array.push(0);
  }

  for (let i = 0; i < numberOfHours; i++) {
    array.push(P_bat_max);
  }

  for (let i = 0; i < numberOfHours; i++) {
    array.push(0);
  }

  for (let i = 0; i < numberOfHours; i++) {
    array.push(P_hydr_max);
  }

  for (let i = 0; i < numberOfHours; i++) {
    array.push(0);
  }

  for (let i = 0; i < numberOfHours; i++) {
    array.push(PV[i]);
  }

  for (let i = 0; i < numberOfHours; i++) {
    array.push(0.0000001);
  }

  for (let i = 0; i < numberOfHours; i++) {
    array.push(0.0000001);
  }

  return array;
};

createArrayC = (numberOfHours, priceEnergy, priceGas) => {
  const array = [];

  if (priceEnergy.length !== numberOfHours) {
    return res
      .status(400)
      .json({ sucess: false, message: "price energy wrong" });
  }
  if (priceGas.length !== numberOfHours) {
    return res.status(400).json({ sucess: false, message: "price gas wrong" });
  }
  //minimize function
  for (let i = 0; i < numberOfHours; i++) {
    array.push(
      priceEnergy[i],
      -priceEnergy[i],
      priceEnergy[i],
      -priceEnergy[i],
      priceGas[i]
    );
  }
  //max function
  array.forEach((element, index) => {
    array.splice(index, 1, -element);
  });

  return array;
};

createArrayD = (numberOfHours) => {
  const array = [];
  const numberOfVariables = numberOfHours * 5;

  for (let i = 0; i < numberOfHours; i++) {
    const n = i * 5;
    const aux = Array(numberOfVariables).fill(0);
    aux.splice(n + 2, 1, 1);
    array.push(aux);
  }

  return array;
};

createArrayE = (numberOfHours, PV) => {
  const array = [];
  for (let i = 0; i < numberOfHours; i++) {
    array.push(PV[i]);
  }

  return array;
};

/**------------ ATENCAO! CODIGO PARA PREVER USANDO A BIBLIOTECA TIMESERIES-ANALYSIS --------------------------------------*/
hyrogenPricesPrediction = async (req, res) => {
  let timeSeriesData;
  let x = [];
  let y = [];
  let data = [];
  let dataTimeseries = [];

  const numberOfPointsToPredict = 1000;
  const numberOfLastePointsToCalculateAR = 5;
  const degreeOfAR = 4; //number of coeficcients

  const response = await axios.get(
    "http://localhost:4000/api/hydrogenPrices-timeseries"
  );

  timeSeriesData = response.data.data.values;
  timeSeriesData.reverse();
  timeSeriesData.forEach((data1, index) => {
    x.push(new Date(data1.datetime).getTime());
    y.push(Number(data1.open));
    data.push({
      timestamp: new Date(data1.datetime).getTime(),
      value: Number(data1.open),
    });
  });

  data.forEach((d) => {
    dataTimeseries.push([d.timestamp, d.value]);
  });

  //dataTimeseries = dataTimeseries.slice(0, 980);

  let t1 = new timeseries.main(dataTimeseries);

  for (let j = 0; j < numberOfPointsToPredict; j++) {
    let t = new timeseries.main(
      dataTimeseries.slice(dataTimeseries.length - numberOfPointsToPredict)
    );

    var coeffs = t.ARMaxEntropy({
      degree: degreeOfAR,
      data: t.data.slice(t.data.length - numberOfLastePointsToCalculateAR),
    });

    var forecast = 0; // Init the value at 0.
    for (var i = 0; i < coeffs.length; i++) {
      // Loop through the coefficients
      // console.log(t.data[numberOfLastePointsToCalculateAR - i]);
      forecast -= dataTimeseries[dataTimeseries.length - 1 - i][1] * coeffs[i];
      // Explanation for that line:
      // t.data contains the current dataset, which is in the format [ [date, value], [date,value], ... ]
      // For each coefficient, we substract from "forecast" the value of the "N - x" datapoint's value, multiplicated by the coefficient, where N is the last known datapoint value, and x is the coefficient's index.
    }

    t.data.push([
      dataTimeseries[dataTimeseries.length - 1][0] + 1800000,
      forecast,
    ]);

    dataTimeseries.push([
      dataTimeseries[dataTimeseries.length - 1][0] + 1800000,
      forecast,
    ]);
  }

  // return res.status(200).json({ sucess: true, data_output: dataTimeseries });

  // return res.status(200).json({ sucess: true, data_output: data });

  var t = new timeseries.main(dataTimeseries);
  var chart_url = t.chart({
    main: true,
    points: [{ color: "ff0000", point: 20, serie: 0 }],
  });

  // console.log(chart_url);

  dataTimeseries.forEach((data) => {
    data[0] = new Date(data[0]);
  });

  return res.status(200).json({ sucess: true, data: dataTimeseries });
};

/**--------------------PREVER USANDO BIBLIOTECA CHAMADA Holt-Winters ---------------------------------------------*/
// hyrogenPricesPrediction = async (req, res) => {
//   let timeSeriesData;
//   let x = [];
//   let y = [];
//   let data = [];
//   let dataTimeseries = [];

//   const numberOfPointsToPredict = 20;
//   const numberOfLastePointsToCalculateAR = 20;
//   const degreeOfAR = 10; //number of coeficcients

//   const response = await axios.get(
//     "http://localhost:4000/api/hydrogenPrices-timeseries"
//   );

//   timeSeriesData = response.data.data.values;
//   timeSeriesData.reverse();
//   timeSeriesData.forEach((data1, index) => {
//     x.push(new Date(data1.datetime).getTime());
//     y.push(Number(data1.open));
//     data.push({
//       timestamp: new Date(data1.datetime).getTime(),
//       value: Number(data1.open),
//     });
//   });

//   console.log(y);

//   data.forEach((d) => {
//     dataTimeseries.push([d.timestamp, d.value]);
//   });

//   const predictionLength = 20;

//   console.log(y.slice(-30, -1));

//   var result = holtWinters(y.slice(-60, -1), predictionLength);

//   console.log(result);

//   return res.status(200).json({ sucess: true, data: result });
// };

mainFunction = async (req, res) => {
  let solarIrradiance;
  const numberOfHours = 24;
  const { solar_panels, system_information } = req.body;

  await axios
    .request({
      method: "GET",
      url: "http://localhost:4000/api/solar-irradiance",
      data: solar_panels,
    })
    .then((response) => {
      solarIrradiance = response.data.data_output;
    });

  // Get the current date
  const today = new Date();

  // Set the date to tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Set the time to the beginning of the day (midnight)
  tomorrow.setHours(1, 0, 0, 0);

  // Get the timestamp in milliseconds
  const timestamp = tomorrow.getTime();

  //return res.status(200).json({ sucess: true, data_output: timestamp });

  solarIrradiance.map((data) => {
    data.timestamp = new Date(data.period_end).getTime();
    return data;
  });
  let loop = true;
  solarIrradiance.forEach((data, index) => {
    if (data.timestamp >= timestamp && loop) {
      solarIrradiance.splice(0, index);
      loop = false;
    }
  });

  //Calculo da energia produzida em 24h PORTUGAL
  let PV = [];
  let j = 0;
  for (let i = 0; i < numberOfHours * 2; i = i + 2) {
    PV[j] = solarIrradiance[i].pv_estimate + solarIrradiance[i + 1].pv_estimate;
    j++;
  }

  //calculo do preco da energia em 24h PORTUGAL
  let energyPrice;
  const year = tomorrow.getFullYear().toString();
  const month =
    tomorrow.getMonth() < 10
      ? "0" + tomorrow.getMonth().toString()
      : tomorrow.getMonth().toString();
  const day =
    tomorrow.getDate() < 10
      ? "0" + tomorrow.getDate().toString()
      : tomorrow.getDate().toString();

  await axios
    .request({
      method: "POST",
      url: "http://localhost:4000/api/energy-price",
      data: {
        year: year,
        month: month,
        day: day,
      },
    })
    .then((response) => {
      energyPrice = response.data.energyInformation.marginalPriceOfPortugal;
    });

  //Calculo do preco do hidrogenio em 24 INTERNACIONAL HYDR
  let gasInfo;
  await axios
    .request({
      method: "GET",
      url: "http://localhost:4000/api/hydrogenPrices-prediction",
    })
    .then((response) => {
      gasInfo = response.data.data;
    });

  gasInfo.map((data) => {
    data[2] = new Date(data[0]).getTime();
    return data;
  });

  let loop1 = true;
  gasInfo.forEach((data, index) => {
    if (data[2] >= timestamp && loop1) {
      gasInfo.splice(0, index);
      loop1 = false;
    }
  });

  let gasPrice = [];
  let m = 0;
  for (let n = 0; n < numberOfHours * 2; n = n + 2) {
    gasPrice[m] = gasInfo[n][1];
    m++;
  }

  console.log(PV);

  //Função Objectiva
  let objectiveResponse;
  await axios
    .request({
      method: "POST",
      url: "http://localhost:4000/api/objective-function",
      data: {
        priceEnergy: energyPrice,
        priceGas: gasPrice,
        PV: PV,
        numberOfHours: numberOfHours,
        P_bat_max: system_information.P_bat_max,
        P_hydr_max: system_information.P_hydr_max,
      },
    })
    .then((response) => {
      objectiveResponse = response.data;
    });
  let solution = [];
  let o = 0;
  for (let i = 0; i < objectiveResponse.solution.length; i = i + 5) {
    solution[o] = {
      ["p_dis_" + o]: objectiveResponse.solution[i],
      ["p_ch_" + o]: objectiveResponse.solution[i + 1],
      ["p_pv_" + o]: objectiveResponse.solution[i + 2],
      ["p_el_ch_" + o]: objectiveResponse.solution[i + 3],
      ["p_el_dis_" + o]: objectiveResponse.solution[i + 4],
    };
    o++;
  }

  let revenue = 0;

  for (let i = 0; i < numberOfHours; i++) {
    revenue =
      revenue +
      ((solution[i]["p_dis_" + i] -
        solution[i]["p_ch_" + i] +
        solution[i]["p_pv_" + i] -
        solution[i]["p_el_ch_" + i]) *
        energyPrice[i] +
        solution[i]["p_el_dis_" + i] * 0.8 * gasPrice[i]);
  }

  const data_output = {
    solution: solution,
    revenue: revenue,
  };

  // return res.status(200).json({ energyPrice, gasPrice, PV });

  return res.status(200).json({
    sucess: true,
    data_output: data_output,
  });
};

module.exports = {
  getHydrogenPrice,
  hydrogenPrice,
  getHydrogenPriceTimeSeries,
  hyrogenPricesPrediction,
  convertUSDtoEUR,
  energyPrice,
  solarIrradiance,
  objectiveFunction,
  mainFunction,
};
