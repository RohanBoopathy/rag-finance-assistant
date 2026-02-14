import { RegisterOptions } from "module";

declare global {
    type FormInputProps = {
        name: string;
        label: string;
        value: string;
        placeholder?: string;
        type?: string;
        error?: string;
        validation?: RegisterOptions
        disabled?: boolean; 
    }

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    }
}

export {}