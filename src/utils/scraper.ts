const http = require('https');

export const getTwitterAccount = (twitterAccount: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/user/details?username=${twitterAccount}`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getTweetsByUser = (handle: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/user/tweets?username=${handle}&section=top&limit=50&include_pinned=true&include_hashtag=true&include_ticker=true`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getTweetsContinuationByUser = (handle: string, continuation_token: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/user/tweets/continuation?username=${handle}&section=top&limit=50&include_pinned=true&include_hashtag=true&include_ticker=true&continuation_token=${continuation_token}`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getTweetsBySearch = (query: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/search/search?query=${query}&section=top&limit=50`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getQuotesByTweetId = (tweet_id: string) => {
    const params = {
        query: `expansions.referenced_tweets.type:quoted expansions.referenced_tweets.id:${tweet_id}`,
        section: 'top',
        limit: '50'
    };

    const queryString = new URLSearchParams(params).toString();
    
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/search/search?${queryString}`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getQuotesContinuationByTweetId = (tweet_id: string, continuation_token: string) => {
    const params = {
        query: `expansions.referenced_tweets.type:quoted expansions.referenced_tweets.id:${tweet_id}`,
        section: 'top',
        limit: '20'
    };

    const queryString = new URLSearchParams(params).toString();
    
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/search/search/continuation?${queryString}&continuation_token=${continuation_token}`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getRepliesByTweetId = (tweet_id: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/replies?tweet_id=${tweet_id}&section=top&limit=50`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getRepliesContinuationByTweetId = (tweet_id: string, continuation_token: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/replies/continuation?tweet_id=${tweet_id}&section=top&limit=50&continuation_token=${continuation_token}`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getRetweetsByTweetId = (tweet_id: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/retweets?tweet_id=${tweet_id}&section=top&limit=50`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}

export const getRetweetsContinuationByTweetId = (tweet_id: string, continuation_token: string) => {
    const options = {
        method: 'GET',
        hostname: 'twitter154.p.rapidapi.com',
        port: null,
        path: `/tweet/retweets/continuation?tweet_id=${tweet_id}&section=top&limit=50&continuation_token=${continuation_token}`,
        headers: {
            'x-rapidapi-key': '3fb981e810mshcaddf3a155a47fcp1d7784jsn6fb6d8e121e6',
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
        }
    };

    return new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const parsedData = JSON.parse(body);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (err: any) => {
                reject(err);
            });
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.end();
    });
}