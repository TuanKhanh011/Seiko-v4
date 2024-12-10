module.exports = async (l) => {
    const randomUserAgent = () => {
    const versions = ["4.0.3", "4.1.1", "4.2.2", "4.3", "4.4", "5.0.2", "5.1", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0"];
    const devices = ["M2004J19C", "S2020X3", "Xiaomi4S", "RedmiNote9", "SamsungS21", "GooglePixel5"];
    const builds = ["RP1A.200720.011", "RP1A.210505.003", "RP1A.210812.016", "QKQ1.200114.002", "RQ2A.210505.003"];
    const chromeVersion = `Chrome/${Math.floor(Math.random() * 80) + 1}.${Math.floor(Math.random() * 999) + 1}.${Math.floor(Math.random() * 9999) + 1}`;
    return `Mozilla/5.0 (Linux; Android ${versions[Math.floor(Math.random() * versions.length)]}; ${devices[Math.floor(Math.random() * devices.length)]} Build/${builds[Math.floor(Math.random() * builds.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Mobile Safari/537.36 WhatsApp/1.${Math.floor(Math.random() * 9) + 1}.${Math.floor(Math.random() * 9) + 1}`;
  };
  const randomIP = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  const headers = () => ({
    "User-Agent": randomUserAgent(),
    "X-Forwarded-For": randomIP(),
  });
    const f = require("fs"), r = require('request');
    try {
        let p, t;
        await new Promise((resolve, reject) => {
            r(l).on('response', function (response) {
                const e = response.headers['content-type'].split('/')[1];
                t = response.headers['content-type'].split('/')[0];
                p = process.cwd() + '/srcipts/cmds/cache' + `/${Date.now()}.${e}`;
                response.pipe(f.createWriteStream(p)).on('finish', resolve).on('error', reject);
            }).on('error', reject);
        });       
        const uploadResponse = await new Promise((resolve, reject) => {
            r({
                method: 'POST',
                url: 'https://api.imgur.com/3/upload',
                headers: {
                  'Authorization': 'Client-ID c76eb7edd1459f3',
                  ...headers()
                },
                formData: t === "video" ? {'video': f.createReadStream(p)} : {'image': f.createReadStream(p)}
            }, (e, response, b) => {
                if (e) {reject(e);return;}
                resolve(JSON.parse(b));
            });
        });       
        f.unlink(p, err => { if (err) throw new Error(err); });
        return {
          link: uploadResponse.data.link
        };
    } catch (e) { throw new Error(e); }
};