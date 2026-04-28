import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
  centered?: boolean;
  highlight?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  linkHref,
  linkLabel = 'Voir tout',
  centered = false,
  highlight,
}: SectionHeaderProps) {
  const titleParts = highlight
    ? title.split(highlight)
    : [title];

  return (
    <div className={`flex items-end justify-between gap-4 mb-8 ${centered ? 'flex-col items-center text-center' : ''}`}>
      <div>
        <h2 className="section-title">
          {highlight && titleParts.length > 1 ? (
            <>
              {titleParts[0]}
              <span className="relative inline-block">
                <span className="relative z-10">{highlight}</span>
                <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#fff500] -z-10" />
              </span>
              {titleParts[1]}
            </>
          ) : title}
        </h2>
        {subtitle && <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>}
      </div>
      {linkHref && (
        <Link
          to={linkHref}
          className="flex-shrink-0 flex items-center gap-1 text-sm font-bold text-black hover:text-gray-600 transition-colors border-b border-black hover:border-gray-600 pb-0.5 whitespace-nowrap"
        >
          {linkLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
