import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import ReactTextTransition from "react-text-transition";
import { allSysInfo, AllSystemInfo } from "tauri-plugin-system-info-api";
import logo from "./assets/icon.png";
import "./App.css";

import { Grid, Typography } from "@mui/material";
import { minVersion, needJDK, canUseLightVersion, minCPUcores, minRAM } from "./config";

function App() {
  const [javaArray, setJavaArray] = useState([]);
  const [installText, setInstallText] = useState("Init servises");
  const [errorText, setErrorText] = useState(null);

  const [systemReady, setSystemReady] = useState(false);
  useEffect(() => {
    setTimeout(() => setInstallText("Check system"), 600);
    allSysInfo()
      .then((data) => {
        const systemInfo = AllSystemInfo.parse(data);
        console.log(systemInfo)
        if (systemInfo?.cpu_count >= minCPUcores && systemInfo.total_memory >= minRAM * 1024) {
          setSystemReady(true);
        } else {
          setTimeout(() => {
            setInstallText("Your system is not ready to run Asteria");
          }, 1200);
        }
      })
      .catch((err) => {
        console.error(err);
        setTimeout(() => {
          setErrorText("Error getting system info");
          setInstallText("Not today :(");
        }, 1200);
      });
  }, []);

  useEffect(() => {
    if (!errorText && systemReady) {
      setTimeout(() => setInstallText("Scan java versions"), 800);
      invoke("get_all_java_versions")
        .then((data) => {
          const filteredData = data.filter((java) => java.jdk === needJDK && java.short >= minVersion && java.lite === canUseLightVersion);
          setJavaArray(filteredData);
          if (filteredData.length > 0) {
            setTimeout(() => setInstallText("Found recomended java version"), 1600);
          } else {
            setTimeout(() => setInstallText("Preparing for installing Java"), 1600);
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorText("Error getting java versions");
          setInstallText("Not today :(");
        });
    }
  }, [systemReady, errorText]);

  return (
    <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
      <Grid item>
        <img src={logo} className="logo" />
      </Grid>
      <Grid item>
        <Typography variant="h5" sx={{ mt: -0.8 }}>
          Asteria Craft
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="h6" color="gray" sx={{ mt: 0.8 }}>
          <ReactTextTransition inline direction="down">
            {installText}
          </ReactTextTransition>
        </Typography>
      </Grid>
      <Grid item>
        {errorText ?? (
          <Typography variant="h6" sx={{ fontSize: 10, mt: 0, color: "red!important" }}>
            <ReactTextTransition inline direction="down">
              {errorText}
            </ReactTextTransition>
          </Typography>
        )}
      </Grid>
    </Grid>
  );
}

export default App;
