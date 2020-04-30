// Fill in your client ID and client secret that you obtained
// while registering the application
// github
const clientID = '22ab64830a6f9cf25a09'
const clientSecret = 'ad2d500329ffcd99f50cfd36381b5669e0ca0618'


// microsoft
const config = {
  client_id: `c6d9df0f-f6d8-47e8-9a68-37ca5dbe8b54`,
  scope: `user.read mail.read`,
  client_secret: 'WlN:FT3mH6xeMmx_LN2tRbwA4YIx-[u-',
  tenant: 'common'
}

const Koa = require('koa');
const path = require('path');
const serve = require('koa-static');
const route = require('koa-route');
const axios = require('axios');
const qs = require('qs')

const app = new Koa();

const main = serve(path.join(__dirname + '/public'));

const githubOauth = async ctx => {
  const requestToken = ctx.request.query.code;
  console.log('authorization code:', requestToken);

  const tokenResponse = await axios({
    method: 'post',
    url: 'https://github.com/login/oauth/access_token?' +
      `client_id=${clientID}&` +
      `client_secret=${clientSecret}&` +
      `code=${requestToken}`,
    headers: {
      accept: 'application/json'
    }
  });

  const accessToken = tokenResponse.data.access_token;
  console.log(`access token: ${accessToken}`);

  const result = await axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      accept: 'application/json',
      Authorization: `token ${accessToken}`
    }
  });
  console.log(result.data);
  const name = result.data.name;

  ctx.response.redirect(`/welcome.html?name=${name}`);
};


const microsoftOauth = async ctx => {
  const requestToken = ctx.request.query.code;
  console.log('authorization code:', requestToken);
  const tokenResponse = await axios({
    url: `https://login.microsoftonline.com/${config.tenant}/oauth2/v2.0/token`,
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify({
      code: requestToken,
      redirect_uri: 'http://localhost:8080/oauth/microsoft/redirect',
      grant_type: `authorization_code`,
      ...config
    })
  }).catch(e => {
    console.log(e)
  })

  const accessToken = tokenResponse.data.access_token;
  const refreshToken = tokenResponse.data.refresh_token
  console.log(`access token: ${accessToken}`);

  const result = await axios({
    url: `https://graph.microsoft.com/v1.0/users`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  console.log(result.data);
  const value = result.data.value[0];

  ctx.response.redirect(`/welcome.html?name=${value}`);
}
app.use(main);
app.use(route.get('/oauth/github/redirect', githubOauth));

app.use(route.get('/oauth/microsoft/redirect', microsoftOauth));

app.listen(8080);
