; Custom uninstaller script to clean up app data
!macro customUnInstall
  ; Kill any running instances of the app before cleanup
  nsExec::ExecToLog 'taskkill /F /IM "lol-account-manager.exe" /T'
  
  ; Wait a moment for processes to terminate
  Sleep 1000
  
  ; Remove the config directory and all its contents from user profile
  RMDir /r "$PROFILE\.shunpo"
  
  ; Also clean up potential app data locations
  RMDir /r "$APPDATA\shunpo"
  RMDir /r "$LOCALAPPDATA\shunpo"
  
  ; Remove any remaining temporary files
  RMDir /r "$TEMP\shunpo"
  
  ; Log the cleanup for debugging
  DetailPrint "Cleaned up Riot Account Manager configuration files"
!macroend
