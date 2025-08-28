const http = require('https');

export const getTweetsBySearch = (keywords: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/search/search?query=${keywords}&section=top&limit=100&start_date=2022-01-01&language=en`,
        headers: {
            'x-rapidapi-key': 'd4f5eb996emsh170c28c495fb7b7p1d427ejsndce1fd86a15d',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<string>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                resolve(body);
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.end();
    });
}

export const getQuotesByTweetId = (tweet_id: string, lastQuoteId?: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        // Here we use the referenced tweet search pattern:
        path: `/search/search?query=referenced_tweets.id%3A${tweet_id}&section=top&limit=100&start_date=2022-01-01&language=en${lastQuoteId ? `&since_id=${lastQuoteId}` : ''}`,
        headers: {
            'x-rapidapi-key': 'd4f5eb996emsh170c28c495fb7b7p1d427ejsndce1fd86a15d',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<string>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                console.log(body);
                resolve(body);
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.end();
    });        
}

export const getRepliesByTweetId = (tweet_id: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/replies?tweet_id=${tweet_id}`,
        headers: {
            'x-rapidapi-key': 'd4f5eb996emsh170c28c495fb7b7p1d427ejsndce1fd86a15d',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<string>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                resolve(body);
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.end();
    });    
}

export const getRetweetsByTweetId = (tweet_id: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/retweets?tweet_id=${tweet_id}`,
        headers: {
            'x-rapidapi-key': 'd4f5eb996emsh170c28c495fb7b7p1d427ejsndce1fd86a15d',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<string>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                resolve(body);
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.end();
    });    
}