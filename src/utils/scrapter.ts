const http = require('https');

export const getTwitterAccount = (twitterAccount: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/user/details?username=${twitterAccount}`,
        headers: {
            'x-rapidapi-key': '1e1c49cc7dmsh02bdfddab2556efp1b90c1jsne07813d1b600',
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

export const getTweetsBySearch = (keywords: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/search/search?query=${keywords}&section=top&limit=50&start_date=2022-01-01&language=en`,
        headers: {
            'x-rapidapi-key': '1e1c49cc7dmsh02bdfddab2556efp1b90c1jsne07813d1b600',
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

export const getQuotesByTweetId = async (tweet_id: string, lastQuoteId?: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/search/search?query=expansions.referenced_tweets.id:${tweet_id}&section=top&limit=50&start_date=2022-01-01&language=en${lastQuoteId ? `&since_id=${lastQuoteId}` : ''}`,
        headers: {
            'x-rapidapi-key': '1e1c49cc7dmsh02bdfddab2556efp1b90c1jsne07813d1b600',
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

export const getRepliesByTweetId = async (tweet_id: string, lastReplyId?: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/replies?tweet_id=${tweet_id}&section=top&limit=50&start_date=2022-01-01&language=en${lastReplyId ? `&since_id=${lastReplyId}` : ''}`,
        headers: {
            'x-rapidapi-key': '1e1c49cc7dmsh02bdfddab2556efp1b90c1jsne07813d1b600',
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

export const getRetweetsByTweetId = async (tweet_id: string, lastRetweetId?: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/retweets?tweet_id=${tweet_id}&section=top&limit=50&start_date=2022-01-01&language=en${lastRetweetId ? `&since_id=${lastRetweetId}` : ''}`,
        headers: {
            'x-rapidapi-key': '1e1c49cc7dmsh02bdfddab2556efp1b90c1jsne07813d1b600',
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