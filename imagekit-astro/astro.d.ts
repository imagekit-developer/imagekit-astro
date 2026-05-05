/// <reference types="astro/client" />

declare module '*.astro' {
  const component: (props: any) => any;
  export default component;
}

declare module 'virtual:@imagekit/astro/config' {
  export const urlEndpoint: string;
  export const transformationPosition: 'path' | 'query';
  const config: { urlEndpoint: string; transformationPosition: 'path' | 'query' };
  export default config;
}
