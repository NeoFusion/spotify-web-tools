function exportSavedTracks() {
    let API_TOKEN = '';
    let DEFAULT_TIME = 3000;
    let CSV_DELIMITER = ';';

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

    function getSavedTracks(url) {
        return getData(url || 'https://api.spotify.com/v1/me/tracks?limit=50')
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

                return delay().then(() => getSavedTracks(res.next));
            });
    }

    function exportSavedTracks() {
        console.log('Exporting saved tracks')
        currentTrackList = [
            ['Name', 'Artist name', 'Album name']
        ]

        return getSavedTracks()
            .then(() => {
                console.log('Saved tracks export finished');
                let csvData = currentTrackList.map(row => row.join(CSV_DELIMITER)).join('\n');
                saveData(csvData, 'SavedTracks.csv');
            })
            .catch(err => {
                console.error(`Unable to export saved tracks: ${err}`);
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

    exportSavedTracks()
        .then(() => console.log('Export finished'));
}
