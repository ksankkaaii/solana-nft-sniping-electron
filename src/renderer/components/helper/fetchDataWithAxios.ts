import axios, {
  AxiosResponse,
  AxiosError,
  AxiosPromise,
  Method,
  AxiosRequestHeaders,
} from "axios";


const setHeader = (
  header:
    | {
      autherization?: string;
      contentType?: string;
    }
    | undefined
): object => {
  return {
    Accept: "*/*",
    "Content-Type": header?.contentType || "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Authorization": `Bearer ${header?.autherization}`
  };
}

interface ServiceParams {
  method: Method;
  route: string;
  headerCred?: {
    autherization?: string;
    contentType?: string;
  };
  data?: object | string;
}

const fetchDataWithAxios = async ({
  method,
  route,
  headerCred,
  data,
}: ServiceParams): Promise<AxiosPromise<AxiosResponse | AxiosError> | null> => {
  const headers = setHeader(headerCred) as AxiosRequestHeaders;

  try {
    const response: AxiosResponse = await axios({
      method,
      url: route,
      data,
      headers
    });

    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }
  catch (err) {
    console.log(`axios error`, err);
    return null;
  }

};

export default fetchDataWithAxios;