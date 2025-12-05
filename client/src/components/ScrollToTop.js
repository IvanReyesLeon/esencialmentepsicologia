import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Scrolls the window to top whenever the route changes
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top when route changes
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
