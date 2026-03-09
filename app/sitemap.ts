import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://gakmail.edgeone.dev',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ]
}
