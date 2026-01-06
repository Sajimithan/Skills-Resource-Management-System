import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SplitText = ({
    text,
    className = '',
    delay = 50,
    duration = 1.25,
    ease = 'power3.out',
    splitType = 'chars',
    from = { opacity: 0, y: 40 },
    to = { opacity: 1, y: 0 },
    threshold = 0.1,
    rootMargin = '-100px',
    textAlign = 'center',
    tag = 'p',
    onLetterAnimationComplete
}) => {
    const ref = useRef(null);
    const animationCompletedRef = useRef(false);
    const onCompleteRef = useRef(onLetterAnimationComplete);
    const [fontsLoaded, setFontsLoaded] = useState(false);

    // Keep callback ref updated
    useEffect(() => {
        onCompleteRef.current = onLetterAnimationComplete;
    }, [onLetterAnimationComplete]);

    useEffect(() => {
        if (document.fonts.status === 'loaded') {
            setFontsLoaded(true);
        } else {
            document.fonts.ready.then(() => {
                setFontsLoaded(true);
            });
        }
    }, []);

    useGSAP(
        () => {
            if (!ref.current || !text || !fontsLoaded) return;
            // Prevent re-animation if already completed
            if (animationCompletedRef.current) return;
            const el = ref.current;

            // Clean up previous instance if exists (though useGSAP usually handles scope cleanup)
            // With SplitType, we can revert by restoring original text if needed, 
            // but usually we just re-split.

            const splitter = new SplitType(el, { types: splitType });

            const startPct = (1 - threshold) * 100;
            const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
            const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
            const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
            const sign =
                marginValue === 0
                    ? ''
                    : marginValue < 0
                        ? `-=${Math.abs(marginValue)}${marginUnit}`
                        : `+=${marginValue}${marginUnit}`;
            const start = `top ${startPct}%${sign}`;

            let targets;
            if (splitType.includes('chars')) targets = splitter.chars;
            if (!targets && splitType.includes('words')) targets = splitter.words;
            if (!targets && splitType.includes('lines')) targets = splitter.lines;

            const tween = gsap.fromTo(
                targets,
                { ...from },
                {
                    ...to,
                    duration,
                    ease,
                    stagger: delay / 1000,
                    scrollTrigger: {
                        trigger: el,
                        start,
                        once: true,
                        fastScrollEnd: true,
                        anticipatePin: 0.4
                    },
                    onComplete: () => {
                        animationCompletedRef.current = true;
                        onCompleteRef.current?.();
                    },
                    willChange: 'transform, opacity',
                    force3D: true
                }
            );

            return () => {
                ScrollTrigger.getAll().forEach(st => {
                    if (st.trigger === el) st.kill();
                });
                splitter.revert();
            };
        },
        {
            dependencies: [
                text,
                delay,
                duration,
                ease,
                splitType,
                JSON.stringify(from),
                JSON.stringify(to),
                threshold,
                rootMargin,
                fontsLoaded
            ],
            scope: ref
        }
    );

    const renderTag = () => {
        const style = {
            textAlign,
            overflow: 'hidden',
            display: 'inline-block',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            willChange: 'transform, opacity'
        };
        const classes = `split-parent ${className}`;
        switch (tag) {
            case 'h1':
                return (
                    <h1 ref={ref} style={style} className={classes}>
                        {text}
                    </h1>
                );
            case 'h2':
                return (
                    <h2 ref={ref} style={style} className={classes}>
                        {text}
                    </h2>
                );
            case 'h3':
                return (
                    <h3 ref={ref} style={style} className={classes}>
                        {text}
                    </h3>
                );
            case 'h4':
                return (
                    <h4 ref={ref} style={style} className={classes}>
                        {text}
                    </h4>
                );
            case 'h5':
                return (
                    <h5 ref={ref} style={style} className={classes}>
                        {text}
                    </h5>
                );
            case 'h6':
                return (
                    <h6 ref={ref} style={style} className={classes}>
                        {text}
                    </h6>
                );
            default:
                return (
                    <p ref={ref} style={style} className={classes}>
                        {text}
                    </p>
                );
        }
    };
    return renderTag();
};

export default SplitText;
