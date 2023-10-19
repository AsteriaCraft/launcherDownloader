// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
extern crate walkdir;

use tauri::Manager;
use std::path::PathBuf;
use std::process::Command;
use walkdir::WalkDir;
use serde::{Serialize};
use window_shadows::set_shadow;

#[derive(Serialize)]
struct JavaVersion {
    path: String,
    version: String,
    short: i32,
    jdk: bool,
    lite: bool,
}
#[tauri::command]
fn get_all_java_versions() -> Result<Vec<JavaVersion>, String> {
    let mut java_dirs: Vec<String> = Vec::new();
    let java_loc: &str;

    if cfg!(target_os = "windows") {
        java_dirs.extend(
            WalkDir::new("C:\\Program Files\\Java").max_depth(1)
                .into_iter()
                .filter_map(|entry| {
                    match entry {
                        Ok(dir_entry) => {
                            if dir_entry.path().exists() {
                                Some(dir_entry.path().to_string_lossy().to_string())
                            } else {
                                None
                            }
                        }
                        Err(_) => None,
                    }
                })
        );
        java_dirs.extend(
            WalkDir::new("C:\\Program Files (x86)\\BellSoft").max_depth(1)
                .into_iter()
                .filter_map(|entry| {
                    match entry {
                        Ok(dir_entry) => {
                            if dir_entry.path().exists() {
                                Some(dir_entry.path().to_string_lossy().to_string())
                            } else {
                                None
                            }
                        }
                        Err(_) => None, // Handle errors as you prefer
                    }
                })
        );
        java_dirs.extend(
            WalkDir::new("C:\\Program Files\\BellSoft").max_depth(1)
                .into_iter()
                .filter_map(|entry| {
                    match entry {
                        Ok(dir_entry) => {
                            if dir_entry.path().exists() {
                                Some(dir_entry.path().to_string_lossy().to_string())
                            } else {
                                None
                            }
                        }
                        Err(_) => None, // Handle errors as you prefer
                    }
                })
        );
        java_loc = "bin\\java.exe";
    } else {
        java_dirs.extend(
            WalkDir::new("/usr/lib/jvm").max_depth(1)
                .into_iter()
                .filter_map(|entry| {
                    match entry {
                        Ok(dir_entry) => {
                            if dir_entry.path().exists() {
                                Some(dir_entry.path().to_string_lossy().to_string())
                            } else {
                                None
                            }
                        }
                        Err(_) => None, // Handle errors as you prefer
                    }
                })
        );
        java_loc = "bin/java";
    }

    let java_versions: Vec<JavaVersion> = java_dirs
        .iter()
        .filter_map(|java_dir| {
            let java_path = get_java_path(java_dir, java_loc);
           
            if java_path.exists() {
                let java_cmd = Command::new(java_path).arg("-version").output();
                match java_cmd {
                    Ok(output) => {
                        let stdout = String::from_utf8_lossy(&output.stderr);
                        let version_match = stdout
                        .lines()
                        .find(|line| line.contains("version"))
                        .and_then(|line| {
                            let version_str = line.split('"').nth(1)?;
                            Some(version_str)
                        });
                        let version_num = match version_match {
                            Some(version) => {
                                let parts: Vec<&str> = version.split('.').collect();
                                if parts.len() > 1 {
                                    if parts[0] > "1" {
                                        parts[0].parse::<i32>().unwrap_or(0)
                                    } else {
                                        parts[1].parse::<i32>().unwrap_or(0)
                                    }
                                } else {
                                    0
                                }
                            }
                            None => 0,
                        };
            
                        let jdk = stdout.to_lowercase().contains("jdk");
                        let lite = java_dir.to_lowercase().contains("lite") || java_dir.to_lowercase().contains("jre");
                        
                        Some(JavaVersion {
                            path: format!("{}", get_java_path(java_dir, java_loc).to_string_lossy()),
                            version: version_match.map(|s| String::from(s)).unwrap_or_else(|| "Unknown version".to_string()),
                            short: version_num,
                            jdk,
                            lite,
                        })
                    }
                    Err(_) => None,
                }
            } else {
                None
            }
        })
        .collect();

    Ok(java_versions)
}

fn get_java_path(java_dir: &str, java_loc: &str) -> PathBuf {
    if cfg!(target_os = "windows") {
        PathBuf::from(java_dir).join(java_loc.replace("/", "\\"))
    } else {
        PathBuf::from(java_dir).join(java_loc.replace("\\", "/"))
    }
}

fn main() {
    tauri::Builder::default().setup(|app| {
        let main_window = app.get_window("main").unwrap();
        set_shadow(main_window, true).unwrap();
        #[cfg(desktop)]
        app.handle().plugin(tauri_plugin_system_info::init())?;
        Ok(())
    })
        .invoke_handler(tauri::generate_handler![get_all_java_versions])
        .plugin(tauri_plugin_upload::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
