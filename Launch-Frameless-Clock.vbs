Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
strDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strScript = strDir & "\Forex-ICT-Native-Widget.ps1"
cmdLine = "powershell.exe -Sta -NoProfile -ExecutionPolicy Bypass -File " & Chr(34) & strScript & Chr(34)
objShell.Run cmdLine, 0, False
