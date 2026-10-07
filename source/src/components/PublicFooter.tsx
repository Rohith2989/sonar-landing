import { footerMarkup } from '../../page-polish/footer-content.mjs';
import '../../page-polish/page-polish.css';

/** Shared public footer for the upstream React build. */
export function PublicFooter() {
  return <div dangerouslySetInnerHTML={{__html: footerMarkup}} />;
}
