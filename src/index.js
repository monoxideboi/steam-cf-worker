export default {
	async fetch(request, env, ctx) {
		// console.log('setting kv');
		// await env.RECENTGAME.put('key', 'text');
		// console.log(await env.RECENTGAME.get('key'));
		const url = `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${env.KEY}&steamid=${env.ID}&format=json`;
		const cacheUrl = new URL(url);

		// Construct the cache key from the cache URL
		const cacheKey = new Request(cacheUrl.toString());
		const cache = caches.default;

		// Check whether the value is already available in the cache
		// if not, you will need to fetch it from origin, and store it in the cache
		let response = await cache.match(cacheKey);

		if (!response) {
			console.log(`Response for request url: ${url} not present in cache. Fetching and caching request.`);
			// If not in cache, get it from origin

			let finaljson = {};

			let add = {};
			for (let i = 0; i < env.GAMES.length; i++) {
				let userStats = await fetch(
					`http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${env.GAMES[i]}&key=${env.KEY}&steamid=${env.ID}`
				)
					.then((data) => {
						return data.json();
					})
					.then((json) => {
						// console.log(json);
						// console.log('got game user stats');
						return json;
					});

				if (userStats.playerstats.achievements) {
					let gameSchema = await fetch(
						`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${env.KEY}&appid=${env.GAMES[i]}`
					)
						.then((data) => {
							return data.json();
						})
						.then((json) => {
							// console.log(json);
							return json.game;
						});
					// console.log(gameSchema);

					let offset = 0;
					// console.log(userStats);
					let userAchiev = userStats.playerstats.achievements;
					// console.log(userAchiev);
					for (let i = 0; i < userAchiev.length; i++) {
						// this can def be optimized lool

						// console.log(userAchiev[i].name);
						// console.log(gameSchema.availableGameStats.achievements[i + offset].name);
						let found = false;
						for (let j = offset; j < gameSchema.availableGameStats.achievements.length; j++) {
							// console.log(gameSchema.availableGameStats.achievements[j].name);
							if (userAchiev[i].name == gameSchema.availableGameStats.achievements[j].name) {
								gameSchema.availableGameStats.achievements[i].achieved = 1;
								console.log('found achiev');
								offset++;
								found = true;
							} else {
								console.log('achiev missing');
							}
						}
						if (!found) {
							gameSchema.availableGameStats.achievements[i].achieved = 0;
						}

						// console.log(gameSchema.availableGameStats.achievements[i + offset]);
					}
					userStats.playerstats.achievements = gameSchema.availableGameStats.achievements;
				}
				add[env.GAMES[i]] = userStats.playerstats;
			}

			await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${env.KEY}&steamid=${env.ID}&format=json`)
				.then((data) => {
					return data.json();
				})
				.then((json) => {
					// console.log(json.response);
					let games = json.response.games;
					// console.log(res);
					console.log(games.length);
					for (let i = 0; i < games.length; i++) {
						// console.log(games[i].appid);
						// console.log(add[games[i].appid]);
						if (add[games[i].appid]) {
							console.log(`game ${games[i].appid} found`);
							add[games[i].appid].playtime_forever = games[i].playtime_forever;
							add[games[i].appid].rtime_last_played = games[i].rtime_last_played;
							if (games[i].playtime_2weeks) {
								add[games[i].appid].playtime_2weeks = games[i].playtime_2weeks;
							} else {
								add[games[i].appid].playtime_2weeks = 0;
							}
						}
					}
				});

			// console.log(add)
			finaljson.games = add;

			let userjson = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.KEY}&steamids=${env.ID}`)
				.then((data) => {
					return data.json();
				})
				.then((json) => {
					// console.log(json);
					return json.response.players[0];
				});

			if (userjson.gameextrainfo) {
				let store = {
					gamename: userjson.gameextrainfo,
					gameid: userjson.gameid,
					lastplayed: Date.now(),
				};
				await env.RECENTGAME.put('recentgame', JSON.stringify(store));
				store.isplaying = true;
				finaljson.currentgame = store;
			} else {
				let recentgame = JSON.parse(await env.RECENTGAME.get('recentgame'));

				finaljson.currentgame = recentgame;
				finaljson.currentgame.isplaying = false;
			}

			let recentjson = await fetch(url)
				.then((data) => {
					return data.json();
				})
				.then((json) => {
					// console.log(json);
					return json.response;
				});

			finaljson.recentgames = recentjson;

			// let recentjson = await fetch(url).then(data => {
			// 	return data.json();
			// }).then(json => {
			// 	console.log(json);
			// 	return json.response;
			// });

			// finaljson = await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${env.KEY}&steamid=${env.ID}&include_played_free_games=1&format=json`)
			// .then((data) => {
			// 	return data.json();
			// })
			// .then((json) => {
			// 	// console.log(json);
			// 	// for (let i = 0; i < json.length; i++) {
			// 	// 	if (.)
			// 	// }
			// 	return json.response;
			// });

			// console.log(finaljson);

			// Must use Response constructor
			response = Response.json(finaljson);

			// Cache API respects Cache-Control headers. Setting s-max-age to 1 min
			// will limit the response to be in cache for 5 minutes max
			response.headers.append('Cache-Control', 's-maxage=60');

			response.headers.append('Access-Control-Allow-Origin', '*');
			response.headers.append('Access-Control-Allow-Headers', '*');

			// Any changes made to the response here will be reflected in the cached value
			ctx.waitUntil(cache.put(cacheKey, response.clone()));
		} else {
			console.log(`Cache hit for: ${url}.`);
		}
		return response;
	},
};
