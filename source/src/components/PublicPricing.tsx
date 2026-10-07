import { useEffect, useRef } from 'react';
import { pricingMarkup } from '../../pricing-scene/pricing-content.mjs';
import { mountPricing } from '../../pricing-scene/pricing-controller.mjs';
import '../../pricing-scene/pricing-scene.css';
import '../../page-polish/page-polish.css';
import '../../page-polish/page-polish.mjs';

/** Shared presentation and lifecycle for the upstream React build. */
export function PublicPricing({lazy = false}: {lazy?: boolean}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = pricingMarkup(null, {page: window.location.pathname === '/pricing'});
    const section = host.current.querySelector('section')!;
    return mountPricing(section, {lazy});
  }, [lazy]);
  return <div ref={host} />;
}
