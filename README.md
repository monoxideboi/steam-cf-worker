# Steam rest api cloudflare worker

This is a cloudflare worker that will create a restapi that will return a bunch of information on your steam games and recently played! This lets you keep your api key yours and hidden while caching requests!

If you do not have a cloudflare account go get it!

If you do not want to use the [cli](#CLI) do it with the [webapp](#webapp)

## CLI

Deploy
```
npm create cloudflare@latest -- --template https://github.com/monoxideboi/steam-cf-worker.git
```
name it steamcfworker, or whatever you want
```
cd steamcfworker
```

The eddit the wrangler.toml file, replace the ID with your steam ID and the games array with a list of game IDs that you want to add

Then create the KV namespace (where it stores your most recent game)

```
npx wrangler kv namespace create RECENTGAME
```

```
npx wrangler deploy
```
You will need to get an [api key from steam](https://steamcommunity.com/dev/apikey). Once you do, do
`npx wrangler secret put KEY`
and put in your key in the input afterwards.

By default the cache time is 5 minutes, feel free to increase this to whatever you want in [the index.js](./src/index.js)!

## Webapp

Go to [the cloudflare workers page](https://workers.cloudflare.com/), click log in and go to the dashboard.

Click Create Worker, and name it whatever you want. Create it.

Then click edit code, and copy paste [the index.js](./src/index.js), replacing the original code. Ignore the error messages.

Then go back with the arrow in the top left (and save), and click on settings. Click the `Variables and Secrets` tab. Click the + Add button to add a variable.

First make the ID variable, name it ID and add your steam ID. You can find it from your steam profile url, or if you have a custom url go to your profile -> edit profile -> custom url and delete the custom name right below to see the ID. It should be only numbers.

Next make the GAMES variable, name it GAMES make the value like this (with brackets): [<gameid>,<gameid>,<gameid>]. You can find a steam game's id from the url like this
```
https://store.steampowered.com/app/440/Team_Fortress_2/ -> 440
```
For example your games field should be like: `[632360,960090,1743850,504230]`

Then make the KEY variable, make the value your API key. Feel free to encrypt this one.

You're done! If you want a custom domain keep reading!

## Custom Domain

If you really want a custom domain, go to the worker dashboard and go to your worker's settings, there will be a tab called `Domains & Routes` that you can set a custom domain for.

## Custom Routes
If you want to make your api link like this: `example.com/steam`, you can go to the worker routes and route the worker to whatever you want!

## Usage
Just use fetch to get the contents of your REST api. The json object return has three objects, games, currentgame, and recentgames.

Appologies for the horrendous casing and variable names, I didnt choose them

### games
Returns an object for each of the IDs you put in. The key is whatever game ID it refers to. It returns
```
steamID: idk tbh
ganeName: name of game
achievements: achievments of the game (named weird, if achieved is 1 that means its complete)
    name: name of achievement server side
    default value: default val of the achiev
    displayName: what the actual name is shown as
    hidden: if 1 it is a secret achiev
    description: description of achiev
    icon: full url of the icon
    icongray: full url of the locked achiev icon
    achieved: if 1 then the achievement was unlocked
stats: stats the game has chosen to give
playtime_forever: playtime in minutes
rtime_last_played: uts of time last played
playtime_2weeks: playtime over 2 weeks in minutes
```

### currentgames
Returns an object with your most recently played game.
```
gamename: game name
gameid: game's steam id
lastplayed: uts of time last played
isplaying: if game is currently being played
```

### recentgames
Returns an object with your recent games and the number of them.
```
total_count: number of games in array
games: array of games
    appid: steam id
    name: name of game
    playtime_2weeks: playtime over 2 weeks in minutes
    playtime_forever: playtime in minutes
    img_icon_url: the hash of the image, combine it with the steam id to get the image like so: http://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{hash}.jpg
    playtime_(windows/mac/linux/deck)_forever: playtime according to individual systems (ngl not that important ig)
```

## Help
My discord is [monoxideboi](https://discord.com/users/375379813403328523), feel free to DM or ping me if you need help.
