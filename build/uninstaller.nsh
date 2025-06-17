; Custom uninstaller script to clean up app data
!macro customUnInstall
  ; Kill any running instances of the app before cleanup
  nsExec::ExecToLog 'taskkill /F /IM "lol-account-manager.exe" /T'
  
  ; Wait a moment for processes to terminate
  Sleep 1000
  
  ; Remove the config directory and all its contents from user profile
  RMDir /r "$PROFILE\.shunpo"
!macroend
