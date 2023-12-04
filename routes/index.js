const express = require("express");
const router = express.Router();
const csvToJson = require("convert-csv-to-json");
const fs = require("fs");

router.get("/convertToJson", async (req, res) => {
  let fileInputName = `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/input/${req.body.year}/elctks.csv`;
  let fileOutputName = `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/data/${req.body.year}/elctks.json`;

  //   let json = csvToJson
  //     .fieldDelimiter(",")
  //     .formatValueByType()
  //     .getJsonFromCsv(fileInputName);

  csvToJson
    .fieldDelimiter(",")
    .formatValueByType()
    .generateJsonFileFromCsv(fileInputName, fileOutputName);

  res.send();
});

router.post("/location", async (req, res) => {
  const { year, county, town } = req.body;
  const locationFile = JSON.parse(
    fs.readFileSync(
      `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/data/${year}/elbase.json`
    )
  );
  const { current_id, data } = getLocation(locationFile, { county, town });
  res.status(200).send({ current_id: current_id, data: data });
});

router.post("/current_data", async (req, res) => {
  const { year, county, town } = req.body;
  const locationFile = JSON.parse(
    fs.readFileSync(
      `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/data/${year}/elbase.json`
    )
  );
  const { current_id } = getLocation(locationFile, { county, town });
  const ctks = JSON.parse(
    fs.readFileSync(
      `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/data/${year}/elctks.json`
    )
  );
  const prof = JSON.parse(
    fs.readFileSync(
      `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/data/${year}/elprof.json`
    )
  );
  let groupObj = { indiv: {} };
  if (current_id[1] !== 0) {
    ctks
      .filter(
        (item) =>
          item.省市別 === current_id[0] &&
          item.鄉鎮市區 === current_id[1] &&
          item.村里別 !== 0 &&
          item.投開票所 === 0
      )
      .map((result) => {
        for (const key in result) {
          if (key === "村里別") {
            groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
              id: result[key],
            };
          } else if (key === "候選人號次") {
            groupObj.indiv[result["村里別"]][result[key]] =
              groupObj.indiv[result["村里別"]][result[key]] || 0;
            groupObj[result[key]] = groupObj[result[key]] || 0;
          } else if (key === "得票數") {
            groupObj.indiv[result["村里別"]][result["候選人號次"]] +=
              result[key];
            groupObj[result["候選人號次"]] += result[key];
          }
        }
      });
    prof
      .filter(
        (item) =>
          item.省市別 === current_id[0] &&
          item.鄉鎮市區 === current_id[1] &&
          item.村里別 !== 0 &&
          item.投開票所 === 0
      )
      .map((result) => {
        for (const key in result) {
          if (key === "村里別") {
            groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
              id: result[key],
            };
          } else if (
            key === "有效票" ||
            key === "無效票" ||
            key === "投票數" ||
            key === "選舉人數"
          ) {
            groupObj[key] = groupObj[key] || 0;
            groupObj.indiv[result["村里別"]][key] =
              groupObj.indiv[result["村里別"]][key] || 0;
            groupObj.indiv[result["村里別"]][key] =
              groupObj.indiv[result["村里別"]][key] + result[key];
            groupObj[key] = groupObj[key] + result[key];
          }
        }
      });
    Object.values(groupObj.indiv).map((item) => {
      const result = locationFile.filter(
        (location) =>
          location.省市 === current_id[0] &&
          location.鄉鎮市區 === current_id[1] &&
          location.村里 === item.id
      );
      item["name"] = result[0].名稱;
    });
    res.send(groupObj);
  } else if (current_id[0] !== 0) {
    ctks
      .filter(
        (item) =>
          item.投開票所 === 0 &&
          item.省市別 === current_id[0] &&
          item.村里別 === 0 &&
          (year > 2012 ? item.選區別 !== 0 : item.鄉鎮市區 !== 0)
      )
      .map((result) => {
        for (const key in result) {
          if (key === "鄉鎮市區") {
            groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
              id: result[key],
            };
          } else if (key === "候選人號次") {
            groupObj.indiv[result["鄉鎮市區"]][result[key]] =
              groupObj.indiv[result["鄉鎮市區"]][result[key]] || 0;
            groupObj[result[key]] = groupObj[result[key]] || 0;
          } else if (key === "得票數") {
            groupObj.indiv[result["鄉鎮市區"]][result["候選人號次"]] =
              groupObj.indiv[result["鄉鎮市區"]][result["候選人號次"]] +
              result[key];
            groupObj[result["候選人號次"]] =
              groupObj[result["候選人號次"]] + result[key];
          }
        }
      });
    prof
      .filter(
        (item) =>
          item.投開票所 === 0 &&
          item.省市別 === current_id[0] &&
          item.村里別 === 0 &&
          (year > 2012 ? item.選區別 !== 0 : item.鄉鎮市區 !== 0)
      )
      .map((result) => {
        for (const key in result) {
          if (key === "鄉鎮市區") {
            groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
              id: result[key],
            };
          } else if (
            key === "有效票" ||
            key === "無效票" ||
            key === "投票數" ||
            key === "選舉人數"
          ) {
            groupObj[key] = groupObj[key] || 0;
            groupObj.indiv[result["鄉鎮市區"]][key] =
              groupObj.indiv[result["鄉鎮市區"]][key] || 0 + result[key];
            groupObj[key] = groupObj[key] + result[key];
          }
        }
      });
    Object.values(groupObj.indiv).map((item) => {
      const result = locationFile
        .filter((location) => location.省市 === current_id[0])
        .filter((location) => location.鄉鎮市區 === item.id);
      item["name"] = result[0].名稱;
    });
    res.send(groupObj);
  } else {
    if (year > 2012) {
      ctks
        .filter(
          (item) =>
            item.投開票所 === 0 &&
            item.選區別 === 0 &&
            item.鄉鎮市區 === 0 &&
            item.村里別 === 0
        )
        .map((result) => {
          for (const key in result) {
            if (key === "省市別") {
              if (result[key] !== 10 && result[key] !== 9)
                groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
                  id: result[key],
                };
              else {
                groupObj.indiv[result["縣市別"]] = groupObj.indiv[
                  result["縣市別"]
                ] || {
                  id: result["縣市別"],
                };
              }
            } else if (key === "候選人號次") {
              if (result["省市別"] !== 10 && result["省市別"] !== 9)
                groupObj.indiv[result["省市別"]][result[key]] =
                  groupObj.indiv[result["省市別"]][result[key]] || 0;
              else {
                groupObj.indiv[result["縣市別"]][result[key]] =
                  groupObj.indiv[result["縣市別"]][result[key]] || 0;
              }
              groupObj[result[key]] = groupObj[result[key]] || 0;
            } else if (key === "得票數") {
              if (result["省市別"] !== 10 && result["省市別"] !== 9)
                groupObj.indiv[result["省市別"]][result["候選人號次"]] =
                  groupObj.indiv[result["省市別"]][result["候選人號次"]] +
                  result[key];
              else {
                groupObj.indiv[result["縣市別"]][result["候選人號次"]] =
                  groupObj.indiv[result["縣市別"]][result["候選人號次"]] +
                  result[key];
              }
              groupObj[result["候選人號次"]] =
                groupObj[result["候選人號次"]] + result[key];
            }
          }
        });
      prof
        .filter(
          (item) =>
            item.投開票所 === 0 &&
            item.選區別 === 0 &&
            item.鄉鎮市區 === 0 &&
            item.村里別 === 0
        )
        .map((result) => {
          for (const key in result) {
            if (key === "省市別") {
              if (result[key] !== 10 && result[key] !== 9)
                groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
                  id: result[key],
                };
              else {
                groupObj.indiv[result["縣市別"]] = groupObj.indiv[
                  result["縣市別"]
                ] || {
                  id: result["縣市別"],
                };
              }
            } else if (
              key === "有效票" ||
              key === "無效票" ||
              key === "投票數" ||
              key === "選舉人數"
            ) {
              groupObj[key] = groupObj[key] || 0;
              if (result["省市別"] !== 10 && result["省市別"] !== 9)
                groupObj.indiv[result["省市別"]][key] =
                  groupObj.indiv[result["省市別"]][key] || 0 + result[key];
              else {
                groupObj.indiv[result["縣市別"]][key] =
                  groupObj.indiv[result["縣市別"]][key] || 0 + result[key];
              }
              groupObj[key] = groupObj[key] + result[key];
            }
          }
        });
      Object.values(groupObj.indiv).map((item) => {
        const result = locationFile.filter(
          (location) =>
            location.鄉鎮市區 === 0 &&
            !location.名稱.includes("省") &&
            (location.省市 !== 10 && location.省市 !== 9
              ? location.省市 === item.id
              : location.縣市 === item.id)
        );
        item["name"] = result[0].名稱;
      });
    } else if (year === 2012) {
      ctks
        .filter(
          (item) =>
            item.省市別 !== 0 &&
            item.選區別 === 0 &&
            item.鄉鎮市區 === 0 &&
            item.村里別 === 0
        )
        .map((result) => {
          for (const key in result) {
            if (key === "省市別") {
              if (result[key] > 0 && result[key] < 6)
                groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
                  id: result[key],
                };
              else {
                groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] = groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] || {
                  id: parseInt(
                    result[key].toString().concat(result["縣市別"].toString())
                  ),
                };
              }
            } else if (key === "候選人號次") {
              if (result["省市別"] > 0 && result["省市別"] < 6)
                groupObj.indiv[result["省市別"]][result[key]] =
                  groupObj.indiv[result["省市別"]][result[key]] || 0;
              else {
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][result[key]] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][result[key]] || 0;
              }
              groupObj[result[key]] = groupObj[result[key]] || 0;
            } else if (key === "得票數") {
              if (result["省市別"] > 0 && result["省市別"] < 6)
                groupObj.indiv[result["省市別"]][result["候選人號次"]] =
                  groupObj.indiv[result["省市別"]][result["候選人號次"]] +
                  result[key];
              else {
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][result["候選人號次"]] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][result["候選人號次"]] + result[key];
              }
              groupObj[result["候選人號次"]] =
                groupObj[result["候選人號次"]] + result[key];
            }
          }
        });
      prof
        .filter(
          (item) =>
            item.省市別 !== 0 &&
            item.選區別 === 0 &&
            item.鄉鎮市區 === 0 &&
            item.村里別 === 0
        )
        .map((result) => {
          for (const key in result) {
            if (key === "省市別") {
              if (result[key] > 0 && result[key] < 6)
                groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
                  id: result[key],
                };
              else {
                groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] = groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] || {
                  id: parseInt(
                    result[key].toString().concat(result["縣市別"].toString())
                  ),
                };
              }
            } else if (
              key === "有效票" ||
              key === "無效票" ||
              key === "投票數" ||
              key === "選舉人數"
            ) {
              groupObj[key] = groupObj[key] || 0;
              if (result["省市別"] > 0 && result["省市別"] < 6) {
                groupObj.indiv[result["省市別"]][key] =
                  groupObj.indiv[result["省市別"]][key] || 0;
                groupObj.indiv[result["省市別"]][key] =
                  groupObj.indiv[result["省市別"]][key] + result[key];
              } else {
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][key] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][key] || 0;
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][key] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][key] + result[key];
              }
              groupObj[key] = groupObj[key] + result[key];
            }
          }
        });
      Object.values(groupObj.indiv).map((item) => {
        const result = locationFile.filter(
          (location) =>
            location.鄉鎮市區 === 0 &&
            !location.名稱.includes("省") &&
            (location.省市 > 0 && location.省市 < 6
              ? location.省市 === item.id
              : location.省市.toString().concat(location.縣市.toString()) ===
                item.id.toString())
        );
        item["name"] = result[0].名稱;
      });
    } else {
      ctks
        .filter(
          (item) =>
            item.省市別 !== 0 &&
            item.選區別 === 0 &&
            item.鄉鎮市區 === 0 &&
            item.村里別 === 0
        )
        .map((result) => {
          for (const key in result) {
            if (key === "省市別") {
              if (result[key] < 3)
                groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
                  id: result[key],
                };
              else {
                groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] = groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] || {
                  id: parseInt(
                    result[key].toString().concat(result["縣市別"].toString())
                  ),
                };
              }
            } else if (key === "候選人號次") {
              if (result["省市別"] < 3)
                groupObj.indiv[result["省市別"]][result[key]] =
                  groupObj.indiv[result["省市別"]][result[key]] || 0;
              else {
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][result[key]] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][result[key]] || 0;
              }
              groupObj[result[key]] = groupObj[result[key]] || 0;
            } else if (key === "得票數") {
              if (result["省市別"] < 3)
                groupObj.indiv[result["省市別"]][result["候選人號次"]] =
                  groupObj.indiv[result["省市別"]][result["候選人號次"]] +
                  result[key];
              else {
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][result["候選人號次"]] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][result["候選人號次"]] + result[key];
              }
              groupObj[result["候選人號次"]] =
                groupObj[result["候選人號次"]] + result[key];
            }
          }
        });
      prof
        .filter(
          (item) =>
            item.省市別 !== 0 &&
            item.選區別 === 0 &&
            item.鄉鎮市區 === 0 &&
            item.村里別 === 0
        )
        .map((result) => {
          for (const key in result) {
            if (key === "省市別") {
              if (result[key] < 3)
                groupObj.indiv[result[key]] = groupObj.indiv[result[key]] || {
                  id: result[key],
                };
              else {
                groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] = groupObj.indiv[
                  result[key].toString().concat(result["縣市別"].toString())
                ] || {
                  id: parseInt(
                    result[key].toString().concat(result["縣市別"].toString())
                  ),
                };
              }
            } else if (
              key === "有效票" ||
              key === "無效票" ||
              key === "投票數" ||
              key === "選舉人數"
            ) {
              groupObj[key] = groupObj[key] || 0;
              if (result["省市別"] < 3) {
                groupObj.indiv[result["省市別"]][key] =
                  groupObj.indiv[result["省市別"]][key] || 0;
                groupObj.indiv[result["省市別"]][key] =
                  groupObj.indiv[result["省市別"]][key] + result[key];
              } else {
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][key] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][key] || 0;
                groupObj.indiv[
                  result["省市別"]
                    .toString()
                    .concat(result["縣市別"].toString())
                ][key] =
                  groupObj.indiv[
                    result["省市別"]
                      .toString()
                      .concat(result["縣市別"].toString())
                  ][key] + result[key];
              }
              groupObj[key] = groupObj[key] + result[key];
            }
          }
        });
      Object.values(groupObj.indiv).map((item) => {
        const result = locationFile.filter(
          (location) =>
            location.鄉鎮市區 === 0 &&
            !location.名稱.includes("省") &&
            (location.省市 < 3
              ? location.省市 === item.id
              : location.省市.toString().concat(location.縣市.toString()) ===
                item.id.toString())
        );
        item["name"] = result[0].名稱;
      });
    }
    res.send(groupObj);
  }
});

router.post("/past_data", async (req, res) => {
  const { county, town } = req.body;
  const list = [1996, 2000, 2004, 2008, 2012, 2016, 2020];
  let data = [];
  list.map((year) => {
    let indivData = { year: year };
    const locationFile = JSON.parse(
      fs.readFileSync(
        `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/data/${year}/elbase.json`
      )
    );
    const { current_id } = getLocation(locationFile, { county, town });
    const ctks = JSON.parse(
      fs.readFileSync(
        `/Users/jws/Documents/Practice/thef2e2023-vote-map-backend/data/${year}/elctks.json`
      )
    );
    if (current_id[1] !== 0) {
      ctks
        .filter((item) => item.投開票所 === 0)
        .filter((item) => item.省市別 === current_id[0])
        .filter((item) => item.鄉鎮市區 === current_id[1])
        .filter((item) => item.村里別 !== 0)
        .map((result) => {
          for (const key in result) {
            if (key === "候選人號次") {
              indivData[result[key]] = indivData[result[key]] || 0;
            } else if (key === "得票數") {
              indivData[result["候選人號次"]] += result[key];
            }
          }
        });
      data.push(indivData);
    } else if (current_id[0] !== 0) {
      ctks
        .filter((item) => item.投開票所 === 0)
        .filter((item) => item.選區別 !== 0)
        .filter((item) => item.省市別 === current_id[0])
        .filter((item) => item.村里別 === 0)
        .map((result) => {
          for (const key in result) {
            if (key === "候選人號次") {
              indivData[result[key]] = indivData[result[key]] || 0;
            } else if (key === "得票數") {
              indivData[result["候選人號次"]] += result[key];
            }
          }
        });
      data.push(indivData);
    } else {
      ctks
        .filter((item) => item.投開票所 === 0)
        .filter((item) => item.選區別 === 0)
        .filter((item) => item.鄉鎮市區 === 0)
        .filter((item) => item.村里別 === 0)
        .map((result) => {
          for (const key in result) {
            if (key === "候選人號次") {
              indivData[result[key]] = indivData[result[key]] || 0;
            } else if (key === "得票數") {
              indivData[result["候選人號次"]] += result[key];
            }
          }
        });
      data.push(indivData);
    }
  });
  res.send(data);
});

function getLocation(data, location) {
  const { county, town } = location;
  let resultData = [];
  if (town) {
    const county_id = data.filter((item) => item.名稱 === county)[0].省市;
    const town_id = data.filter((item) => item.名稱 === town)[0].鄉鎮市區;
    data
      .filter((item) => item.省市 === county_id)
      .filter((item) => item.鄉鎮市區 === town_id)
      .filter((item) => item.村里 !== 0)
      .map((result) => {
        resultData.push(result.名稱);
      });
    return { current_id: [county_id, town_id], data: resultData };
  } else if (county) {
    const county_id = data.filter((item) => item.名稱 == county)[0].省市;
    data
      .filter((item) => item.省市 === county_id)
      .filter((item) => item.鄉鎮市區 !== 0)
      .filter((item) => item.村里 === 0)
      .map((result) => {
        resultData.push(result.名稱);
      });
    return { current_id: [county_id, 0], data: resultData };
  } else {
    data
      .filter((item) => item.鄉鎮市區 === 0)
      .map((result) => {
        if (!result.名稱.includes("省")) {
          resultData.push(result.名稱);
        }
      });
    if (resultData.indexOf("全國") !== 0) {
      let lastObj = resultData.pop();
      resultData.unshift(lastObj);
    }
    return { current_id: [0, 0], data: resultData };
  }
}

module.exports = router;
