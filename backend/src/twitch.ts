import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class TwitchClient {
  private http: AxiosInstance;
  private clientId: string;

  constructor(baseURL: string, clientId: string) {
    this.http = axios.create({
      baseURL,
    });

    this.clientId = clientId;
  }

  async validate(token: string): Promise<AxiosResponse> {
    return this.http.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
