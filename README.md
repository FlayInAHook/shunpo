<div align="center">



<h1><img src="build/icon.png" alt="Icon" style="width:64px; vertical-align:middle;"/> SHUNPO  <img src="build/icon.png" alt="Icon" style="width:64px; vertical-align:middle;"/></h1>

*A no hassle League of Legends account manager*

[![Downloads](https://img.shields.io/github/downloads/FlayInAHook/shunpo/total?style=for-the-badge&logo=github&color=4fc3f7)](https://github.com/FlayInAHook/shunpo/releases) [![Latest Release](https://img.shields.io/github/v/release/FlayInAHook/shunpo?style=for-the-badge&logo=github&color=00c853)](https://github.com/FlayInAHook/shunpo/releases/latest) [![License](https://img.shields.io/github/license/FlayInAHook/shunpo?style=for-the-badge&color=ff7043)](#license) [![discord](https://img.shields.io/badge/contact-me-blue?style=for-the-badge&logo=discord&logoColor=white)](https://discordapp.com/users/386537086859214858)

[![Electron](https://img.shields.io/badge/Electron-35.1.5-2B2E3A?style=for-the-badge&logo=electron)](https://www.electronjs.org/) [![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Chakra UI](https://img.shields.io/badge/Chakra_UI-3.21.0-319795?style=for-the-badge&logo=chakraui)](https://chakra-ui.com/)

</div>

---

## ✨ Features

- 🎮 **Multi-Account Management** - Seamlessly manage multiple League of Legends accounts
- 🏆 **Account Information** - Tracks the name, rank, phone verification and number of champions for each account
- 🎨 **Integrated UI** - Clean, responsive interface overlayed directly on your league client
- 🔄 **Auto-Start & Updates** - Automatic startup and updates make the usage frictionless

![App Preview](resources/app_preview.png)

## Download

[Shunpo can be downloaded from the latest release for Windows!](https://github.com/FlayInAHook/shunpo/releases)

## Development

```bash
set BUILD_TEST=true
#alternative for powershell $ENV:BUILD_TEST=true
bun run dev
```

### Building

```bash
# Build for Windows
bun run build:win
```

## Project Structure

```
shunpo/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts
│   └── renderer/       # React frontend
├── build/              # Build assets
├── resources/          # App resources
└── scripts/            # Build scripts
```

## Requirements

- Windows 10/11
- League of Legends

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- **LCU API**: [hasagi-core](https://github.com/dysolix/hasagi-core) - League Client Update API integration
- **Original Overlay**: [electron-overlay-window](https://github.com/SnosMe/electron-overlay-window) - Base overlay implementation

---

<div align="center">
  
**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [FlayInAHook](https://github.com/FlayInAHook)

</div>
