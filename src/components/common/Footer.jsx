import React from 'react';
import packageJson from '../../../package.json';

const Footer = () => {
  const version = packageJson?.version || '1.3.0';

  return (
    <footer className="app-footer-fixed">
      <table className="app-footer-table">
        <tbody>
          <tr>
            <td className="footer-col-left">
              <span>ServiceNow Dashboard</span>
            </td>
            <td className="footer-col-center">
              <span>
                Desenvolvido por <b><a href="https://github.com/caiquenovaes1994/" target="_blank">Caique Novaes</a></b> com ❤️ e ☕ - 2026
              </span>
            </td>
            <td className="footer-col-right">
              <span>v{version}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </footer>
  );
};

export default Footer;
