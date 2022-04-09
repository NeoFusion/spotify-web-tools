function exportPlaylists() {
    let API_TOKEN = '';
    let DEFAULT_TIME = 3000;
    let CSV_DELIMITER = ';';

    let playlists = [];
    let currentTrackList = [];

    let saveData = (function () {
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        return function (data, fileName) {
            let blob = new Blob([data], {type: 'text/csv'}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());

    /**
     * @returns Promise
     */
    function getPlaylists(url) {
        console.log('Loading playlists');

        return getData(url || 'https://api.spotify.com/v1/me/playlists?limit=50')
            .then(res => {
                playlists = [].concat(playlists, res.items);

                if (!res.next) {
                    return playlists;
                }

                return getPlaylists(res.next);
            });
    }

    function exportPlaylist(playlist) {
        console.log(`Exporting playlist "${playlist.name}"`);
        currentTrackList = [
            ['Name', 'Artist name', 'Album name']
        ];

        return getData(`https://api.spotify.com/v1/playlists/${playlist.id}`)
            .then(res => getPlaylistTracks(res.tracks.href))
            .then(() => {
                console.log(`Playlist export finished: "${playlist.name}"`);
                let csvData = currentTrackList.map(row => row.join(CSV_DELIMITER)).join('\n');
                saveData(csvData, `${playlist.name}.csv`);
            })
            .catch(err => {
                console.error(`Unable to export ${playlist.id}: ${err}`);
            });
    }

    function getPlaylistTracks(url) {
        return getData(url)
            .then(res => {
                (res.items || []).forEach(i => {
                    currentTrackList.push(
                        [
                            i.track.name,
                            i.track.artists.map(a => a.name).join(', '),
                            i.track.album.name,
                        ]
                    );
                });

                if (!res.next) {
                    return Promise.resolve();
                }

                return delay().then(() => getPlaylistTracks(res.next));
            });
    }

    /**
     * Get data for URL in JSON online
     *
     * @param url
     * @returns {Promise<*>}
     */
    function getData(url) {
        return fetch(url, {
            method: 'GET',
            headers: {
                authorization: `Bearer ${API_TOKEN}`,
            },
        })
            .then(res => res.json());
    }

    function delay(time) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), time || DEFAULT_TIME);
        })
    }

    getPlaylists()
        .then(playlists => {
            console.log(`Playlists loaded: ${playlists.length} found.`);

            playlists.reduce(async (previousPromise, playlist) => {
                return previousPromise.then(() => delay()).then(() => exportPlaylist(playlist));
            }, Promise.resolve())
                .then(() => console.log('Export finished'));
        });
}
