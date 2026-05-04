"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon } from "lucide-react";

type ReceiptLinkProps = {
  receiptUrl: string;
  className?: string;
  imageClassName?: string;
};

function parseReceiptUrl(receiptUrl: string) {
  if (!receiptUrl) return null;

  try {
    const url = new URL(receiptUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (match) {
      return {
        bucket: match[1],
        path: decodeURIComponent(match[2]),
      };
    }
  } catch {
    // If receiptUrl is not a full URL, treat it as a path within the receipts bucket.
    if (!receiptUrl.startsWith("http://") && !receiptUrl.startsWith("https://")) {
      return { bucket: "receipts", path: receiptUrl };
    }
  }

  return null;
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(url);
}

export function ReceiptLink({ receiptUrl, className = "", imageClassName = "w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0" }: ReceiptLinkProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(true);

  const storageEntry = useMemo(() => parseReceiptUrl(receiptUrl), [receiptUrl]);

  useEffect(() => {
    let canceled = false;

    async function resolveSignedUrl() {
      if (!storageEntry) {
        if (!canceled) setResolvedUrl(receiptUrl);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(storageEntry.bucket)
        .createSignedUrl(storageEntry.path, 60);

      if (!canceled) {
        if (!error && data?.signedUrl) {
          setResolvedUrl(data.signedUrl);
        } else {
          setResolvedUrl(receiptUrl);
        }
      }
    }

    resolveSignedUrl();
    return () => {
      canceled = true;
    };
  }, [receiptUrl, storageEntry]);

  // Don't render until we have a resolved URL
  if (!resolvedUrl) {
    return null;
  }

  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 flex items-start gap-3 ${className}`}>
      {showImage && isImageUrl(resolvedUrl) && (
        <img
          src={resolvedUrl}
          alt="إيصال الدفع"
          className={imageClassName}
          onError={() => setShowImage(false)}
        />
      )}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs text-gray-500">إيصال التحويل</p>
        </div>
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary-600 hover:underline"
        >
          عرض كاملاً ↗
        </a>
      </div>
    </div>
  );
}
