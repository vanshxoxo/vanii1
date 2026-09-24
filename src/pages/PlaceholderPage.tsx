import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';

interface PlaceholderPageProps {
  title: string;
  description: string;
  breadcrumb: string;
}

export default function PlaceholderPage({ title, description, breadcrumb }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <Breadcrumbs items={[{ label: breadcrumb }]} />
      <div className="mt-8 flex flex-col items-center text-center animate-slide-up-fade">
        <div className="w-16 h-16 rounded-2xl bg-butter flex items-center justify-center mb-6 rotate-3">
          <Construction size={28} className="text-ink" />
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl font-light text-ink mb-3">{title}</h1>
        <p className="text-sm lg:text-base text-ink-soft leading-relaxed max-w-lg mb-8">
          {description}
        </p>
        <Link to="/">
          <Button variant="outline" size="lg">
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
