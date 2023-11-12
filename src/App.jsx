import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import ReactTextTransition from "react-text-transition";
import { allSysInfo } from "tauri-plugin-system-info-api";
import { Grid, Typography, Box } from "@mui/material";
import { minVersion, needJDK, canUseLightVersion, minCPUcores, minRAM, enableProtector, versionCheck } from "./config";
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'
import LinearProgress from '@mui/material/LinearProgress';
import logo from "./assets/icon.png";
import { toast } from 'react-toastify'
import { download } from "tauri-plugin-upload-api";
import { join, appCacheDir } from '@tauri-apps/api/path';
import { javaLink, javaName } from "./systemHelper";
import { Command } from '@tauri-apps/api/shell';
import { arch, type } from '@tauri-apps/api/os';
import "./App.scss";





function App() {
  const [javaArray, setJavaArray] = useState([]);
  const [systemInfo, setSystemInfo] = useState({});

  const [installText, setInstallText] = useState("Init servises");
  const [errorText, setErrorText] = useState(null);

  const [appReady, setAppReady] = useState(false);
  const [systemReady, setSystemReady] = useState(false);
  const [javaReady, setJavaReady] = useState(false);
  const [javaDir, setJavaDir] = useState(false);
  const [javaInstallReady, setJavaInstallReady] = useState(false);
  const [javaNeedUpdate, setNeedUpdate] = useState(false);
  const [cacheDir, setCacheDir] = useState("");
  const [system, setSystem] = useState({});

  useEffect(() => {
    if (errorText) {
      toast.error(errorText);
      setInstallText("Error occurred. Contact administrator.");
    }
  }, [errorText]);

  useEffect(() => {
    appCacheDir().then(data => setCacheDir(data))
    Promise.all([arch(), type()]).then(([archData, typeData]) => {
      setSystem({ arch: archData, type: typeData })
    })
  }, []);
  useEffect(() => {
    setTimeout(() => setInstallText("Check system"), 600);
    if (versionCheck) {
      checkUpdate().then((shouldUpdate, manifest) => {
        if (shouldUpdate) {
          setInstallText("Found new update");
          console.log(
            `Installing update ${manifest?.version}, ${manifest?.date}, ${manifest?.body}`
          )
          setTimeout(() => {
            installUpdate().then(() => relaunch())
          }, 1200);
        }
        else {
          setAppReady(true)
        }
      }).catch((err) => {
        console.error(err);
        setTimeout(() => {
          setErrorText("Error checking update");
        }, 1200);
      });
    } else {
      setAppReady(true)
    }
  }, []);

  useEffect(() => {
    if (!errorText && appReady) {
      allSysInfo().then((data) => {
        setSystemInfo(data);
        if (data?.cpu_count >= minCPUcores && data.total_memory >= minRAM * 1024 * 1024) {
          if (enableProtector) {
            setTimeout(() => {
              setInstallText("Starting protection middlevare");
              setSystemReady(true);
            }, 1200);
          } else {
            setSystemReady(true);
            setTimeout(() => {
              setInstallText("Check complete");
            }, 1200);
          }
        } else {
          setTimeout(() => {
            setInstallText("Your system is not ready to run Asteria");
          }, 1200);
        }
      }).catch((err) => {
        console.error(err);
        setTimeout(() => {
          setErrorText("Error getting system info");
        }, 1200);
      });
    }
  }, [appReady, errorText]);

  useEffect(() => {
    if (!errorText && systemReady) {
      setTimeout(() => setInstallText("Scan java versions"), 800);
      invoke("get_all_java_versions").then((data) => {
        const filteredData = data.filter((java) => java.jdk === needJDK && java.short >= minVersion && java.lite === canUseLightVersion);
        setJavaArray(filteredData);
        if (filteredData.length > 0) {
          setTimeout(() => {
            setInstallText("Found recomended java version")
            setJavaReady(true)
          }, 1600);
        } else {
          setTimeout(() => {
            setInstallText("Preparing for installing Java")
            setNeedUpdate(true)
          }, 1600);
        }
      }).catch((err) => {
        console.error(err);
        setErrorText("Error getting java versions");
      });
    }
  }, [systemReady, javaReady, errorText]);

  useEffect(() => {
    if (!errorText && javaNeedUpdate) {
      join(cacheDir, javaName(system)).then(downloadPath => {
        setJavaDir(downloadPath);
        setTimeout(() => {
          setInstallText("Downloading java");
          download(
            javaLink(system),
            downloadPath,
            () => { },
            { "Content-Type": "text/plain" }, // optional headers to send with the request
          ).then(() => {
            setInstallText("Installing java");
            setJavaInstallReady(true)
          }).catch((err) => {
            console.error(err);
            setErrorText("Error downloading java");
          });
        }, 1200)
      }).catch((err) => {
        console.error(err);
        setErrorText("Error downloading java");
      });
    }
  }, [javaNeedUpdate, errorText]);

  useEffect(() => {
    if (!errorText && javaInstallReady) {
      let command;
      switch (system.type) {
        case "Windows_NT":
          command = new Command("installJavaWin", ['/i', javaDir, '/passive'])
          break
        case "Darwin":
          command = new Command("installJavaDarwin", ['-pkg', javaDir, , '-target /', '/passive'])
          break
        case "Linux":
          command = new Command("installJavaLinux", ['-i', javaDir, '/passive'])
          break
      }

      command.on('close', data => {
        setJavaReady(true)
        setNeedUpdate(false)
        console.log(`command finished with code ${data.code} and signal ${data.signal}`);
      });
      command.on('error', error => {
        setErrorText("Error installing java");
        console.error(`command error: "${error}"`)
      });
      command.stdout.on('data', line => console.log(`command stdout: "${line}"`));
      command.stderr.on('data', line => console.log(`command stderr: "${line}"`));

      command.execute();
    }
  }, [javaInstallReady, errorText]);

  useEffect(() => {
    if (!errorText && javaReady && !javaNeedUpdate) {
      setTimeout(() => setInstallText("Check launcher hash"), 800);
    }
  }, [javaNeedUpdate, errorText, javaReady]);
  return (
    <Grid container spacing={0} direction="column" >
      <Grid item xs={12}>
        <img src={logo} className="logo" />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h2" sx={{ mt: 21, ml: 4 }}>
          Asteria Craft
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" color="gray" sx={{ mt: 1.2, ml: 4 }}>
          <ReactTextTransition inline direction="down">
            {installText}
          </ReactTextTransition>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ width: '100%', mt: 2.2 }}>
          <LinearProgress className={errorText ? "ErrorBar" : "VolumeBar"} value={16} />
        </Box>
      </Grid>
    </Grid>
  );
}

export default App;
