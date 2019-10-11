# PoorchatBot

[Online](https://jarchiwum.pl/wonziu/2335317636517962?platform=facebook) 

## What is this all about?

![Preview](preview.jpg)

IRC Bot which listen users messages and saved them in the mongo database, so later on, after live stream is over, users can watch the live chat replay. It can also send messages.

It's based on websocket which sends IRC like events whenever user post new message, join chanel etc.

## Update 11.10.2019 

* Wykop API to post list of strims from last 24h on Wykop Mikroblog
* Facebook and Twitch to TouTube video reupload based on youtube-dl and ffmpeg packages 

## What I use?

* [NodeJS](https://nodejs.org/en/) 
* [MongoDB](https://www.mongodb.com/) 
* [Vultr](https://vultr.com/) 
* [Youtube-dl](https://ytdl-org.github.io/youtube-dl/index.html) 
* [FFmpeg](https://www.ffmpeg.org/)

## Installation
You can just clone repository files and run to install all dependencies:

`npm install`

After that just run to start server:

`npm run dev`

If you would like to make it work, yo will also need to fill *config-sample.josn* file with your data, and then remove *-sample* from file name.

*All project files are located in ./src/*