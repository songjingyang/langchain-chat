"use client";

import { generateAllStructuredData } from '@/lib/seo/structured-data'

interface StructuredDataProps {
  type?: 'webApplication' | 'organization' | 'faq' | 'all'
}

export function StructuredData({ type = 'all' }: StructuredDataProps) {
  const structuredData = generateAllStructuredData()
  
  const getDataByType = () => {
    switch (type) {
      case 'webApplication':
        return structuredData.webApplication
      case 'organization':
        return structuredData.organization
      case 'faq':
        return structuredData.faq
      case 'all':
      default:
        return [
          structuredData.webApplication,
          structuredData.organization,
          structuredData.faq
        ]
    }
  }

  const data = getDataByType()
  const jsonLd = Array.isArray(data) ? data : [data]

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item, null, 2)
          }}
        />
      ))}
    </>
  )
}
