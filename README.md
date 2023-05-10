# Firesync

Synchronize your vaults via Firebase. This is the **UNOFFICIAL** plugin for obsidian in order to synchronize your vaults on various devices via Firebase.

## Notice

If you would like to get easy access to consistent, reliable and stable synchronization, please check out the [Obsidain official synchronization feature](https://obsidian.md/sync).

## Features

- Real-time synchronization across your devices using Firebase
- All functionalities work with [Firebase's free plan](https://firebase.google.com/pricing)

## How to set up

1. Back up your vault.
1. Create your [Firebase project](https://console.firebase.google.com/) if you do not have one.
1. Create an authenticated user via Firebase Authentication
1. Update CORS settings of Cloud Storage
1. Deploy rules to Cloud Storage
1. Install this plugin into your Obisidian vault.
1. Enable this plugin in `Community plugins` section of Obsidian's preferences.
1. Open Firesync section on the bottom of Obsidian's preferences.
1. Input `API key`, `Auth Domain`, `Project ID`, `Storage Bucket`, `App ID`, `Email` and `Password`.
1. Enable `Sync Files & Folderes` switch.

## Howt to develop

TBD.

## TODO

- [ ] split events and wait processing to prevent burst requests
- [ ] check generations on the storage rule
