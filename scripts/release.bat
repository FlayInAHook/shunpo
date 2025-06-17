@echo off
setlocal

REM Script to bump version and create a release tag
REM Usage: release.bat [patch|minor|major]

set VERSION_TYPE=%1
if "%VERSION_TYPE%"=="" set VERSION_TYPE=patch

if not "%VERSION_TYPE%"=="patch" if not "%VERSION_TYPE%"=="minor" if not "%VERSION_TYPE%"=="major" (
    echo Invalid version type. Use: patch, minor, or major
    exit /b 1
)

echo Bumping %VERSION_TYPE% version...

REM Bump version in package.json
call npm version %VERSION_TYPE% --no-git-tag-version

REM Get the new version
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set NEW_VERSION=%%i

echo New version: %NEW_VERSION%

REM Stage the package.json change
git add package.json

REM Commit the version bump
git commit -m "bump version to v%NEW_VERSION%"

REM Create the tag
git tag "v%NEW_VERSION%"

echo Created tag: v%NEW_VERSION%
echo.
echo To trigger the release build, push the tag:
echo git push origin v%NEW_VERSION%
echo.
echo Or push everything:
echo git push ^&^& git push --tags
