import { GoogleIcon } from "./GoogleIcon";
import { GithubIcon } from "./GithubIcon";

export const SocialLogin = () => (
    <div className="social-login">
        <p className="social-login-text">Or continue with</p>
        <div className="social-login-buttons">
            <button type="button" className="social-btn google-btn"><GoogleIcon /> Google</button>
            <button type="button" className="social-btn github-btn"><GithubIcon /> GitHub</button>
        </div>
    </div>
);