const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jsontoxml = require('jsontoxml');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const buildforsdg = {
  region: {
    name: "Africa",
    avgAge: 19.7,
    avgDailyIncomeInUSD: 5,
    avgDailyIncomePopulation: 0.71
  },
  periodType: "days",
  timeToElapse: 58,
  reportedCases: 674,
  population: 66622705,
  totalHospitalBeds: 1380614
};

function calcIBRT(currentlyInfected, timeToElapse) {
  return currentlyInfected * 2 ** Math.trunc(timeToElapse / 3);
}

const calcHBBRT = (totalHospitalBeds, severeCasesByRequestedTime) => {
  const availableHospitalBeds = totalHospitalBeds * 0.35;
  const futureBeds = availableHospitalBeds - severeCasesByRequestedTime;
  return Math.trunc(futureBeds);
};

const calcDIF = (infectnsByRqstdTm, percent, avgDailyIncome, timeToElapse) => {
  const dollarsInFlight = (infectnsByRqstdTm * percent * avgDailyIncome) / timeToElapse;
  return Math.trunc(dollarsInFlight);
};

const covid19ImpactEstimator = (data) => {
  const output = {};

  output.data = data;

  if (data.periodType === 'weeks') data.timeToElapse *= 7;
  if (data.periodType === 'months') data.timeToElapse *= 30;

  const impact = {
    currentlyInfected: data.reportedCases * 10
  };

  impact.infectionsByRequestedTime = calcIBRT(impact.currentlyInfected, data.timeToElapse);
  impact.severeCasesByRequestedTime = Math.trunc(impact.infectionsByRequestedTime * 0.15);
  impact.hospitalBedsByRequestedTime = calcHBBRT(data.totalHospitalBeds,
    impact.infectionsByRequestedTime * 0.15);
  impact.casesForICUByRequestedTime = Math.trunc(impact.infectionsByRequestedTime * 0.05);
  impact.casesForVentilatorsByRequestedTime = Math.trunc(impact.infectionsByRequestedTime * 0.02);
  const avgDly = data.region.avgDailyIncomePopulation;
  const money = data.region.avgDailyIncomeInUSD;
  impact.dollarsInFlight = calcDIF(impact.infectionsByRequestedTime,
    avgDly, money, data.timeToElapse);

  const severeImpact = {
    currentlyInfected: data.reportedCases * 50
  };

  severeImpact.infectionsByRequestedTime = calcIBRT(severeImpact.currentlyInfected,
    data.timeToElapse);
  const value0 = severeImpact.infectionsByRequestedTime;
  severeImpact.severeCasesByRequestedTime = Math.trunc(value0 * 0.15);
  severeImpact.hospitalBedsByRequestedTime = calcHBBRT(data.totalHospitalBeds,
    severeImpact.severeCasesByRequestedTime);
  const valueVal = severeImpact.infectionsByRequestedTime * 0.05;
  severeImpact.casesForICUByRequestedTime = Math.trunc(valueVal);
  const value1 = severeImpact.infectionsByRequestedTime * 0.02;
  severeImpact.casesForVentilatorsByRequestedTime = Math.trunc(value1);
  severeImpact.dollarsInFlight = calcDIF(severeImpact.infectionsByRequestedTime,
    data.region.avgDailyIncomePopulation, data.region.avgDailyIncomeInUSD, data.timeToElapse);

  output.impact = impact;

  output.severeImpact = severeImpact;

  return output;
};

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'requests.log'), { flags: 'a' });

// setup the logger
app.use(morgan(':method :url :status :response-time ms', { stream: accessLogStream }));

app.post('/', (req, res) => {
  let data = {};
  if(req.body.data) data = req.body.data; 
  else data = buildforsdg;
  const output = JSON.stringify(covid19ImpactEstimator(data));

  res.send(output);
});

app.post('//json', (req, res) => {
  let data = {};
  if(req.body.data) data = req.body.data; 
  else data = buildforsdg;
  const output = JSON.stringify(covid19ImpactEstimator(data));

  res.send(output);
});

app.post('/api/v1/on-covid-19/', (req, res) => {
  let data = {};
  if(req.body.data) data = req.body.data; 
  else data = buildforsdg;
  const output = JSON.stringify(covid19ImpactEstimator(data));

  res.send(output);
});

app.post('/api/v1/on-covid-19/json', (req, res) => {
  let data = {};
  if(req.body.data) data = req.body.data; 
  else data = buildforsdg;
  const output = JSON.stringify(covid19ImpactEstimator(data));

  res.send(output);
});

app.post('//xml', (req, res) => {
  let data = {};
  if(req.body.data) data = req.body.data; 
  else data = buildforsdg;
  const output = JSON.stringify(covid19ImpactEstimator(data));

  res.type('xml');
  res.send(jsontoxml(output));
});

app.post('/api/v1/on-covid-19/xml', (req, res) => {
  let data = {};
  if(req.body.data) data = req.body.data; 
  else data = buildforsdg;
  const output = JSON.stringify(covid19ImpactEstimator(data));

  res.type('xml');
  res.send(jsontoxml(output));
});

app.get('//logs', (req, res) => {
  res.type('text');
  res.sendFile(path.resolve(__dirname, "requests.log"));
});

app.get('/api/v1/on-covid-19/logs', (req, res) => {
  res.type('text');
  res.sendFile(path.resolve(__dirname, "requests.log"));
});

app.listen(process.env.PORT || 5000, () => {
  console.log('app is running');
});