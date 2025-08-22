// src/app/core/interceptors/unicode-decode.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UnicodeDecodeInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map(event => {
        // Seulement traiter les HttpResponse
        if (event instanceof HttpResponse) {
          // Décoder le body de la réponse
          const decodedBody = this.decodeUnicodeInObject(event.body);
          
          console.log('🌍 Unicode Interceptor - Réponse décodée pour:', req.url);
          
          // Créer une nouvelle réponse avec le body décodé
          return event.clone({
            body: decodedBody
          });
        }
        return event;
      })
    );
  }

  /**
   * Décode les caractères Unicode échappés dans une chaîne
   */
  private decodeUnicodeString(str: string): string {
    if (!str || typeof str !== 'string') return str;
    
    try {
      // Décoder les séquences \uXXXX
      let decoded = str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
      });
      
      // Décoder les entités HTML si présentes
      decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(dec);
      });
      
      // Décoder les entités HTML nommées courantes
      const htmlEntities: { [key: string]: string } = {
        '&eacute;': 'é',
        '&egrave;': 'è',
        '&ecirc;': 'ê',
        '&agrave;': 'à',
        '&acirc;': 'â',
        '&ccedil;': 'ç',
        '&ocirc;': 'ô',
        '&ugrave;': 'ù',
        '&ucirc;': 'û',
        '&icirc;': 'î',
        '&ntilde;': 'ñ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
      };
      
      for (const [entity, char] of Object.entries(htmlEntities)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), char);
      }
      
      // Utiliser decodeURIComponent pour les caractères encodés en URL
      try {
        if (decoded.includes('%')) {
          decoded = decodeURIComponent(decoded);
        }
      } catch (e) {
        // Ignorer les erreurs de decodeURIComponent
      }
      
      return decoded;
    } catch (error) {
      console.warn('Erreur décodage Unicode pour:', str, error);
      return str;
    }
  }

  /**
   * Décode récursivement les caractères Unicode dans un objet
   */
  private decodeUnicodeInObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.decodeUnicodeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.decodeUnicodeInObject(item));
    }
    
    if (typeof obj === 'object') {
      const decoded: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Décoder aussi les clés si nécessaire
          const decodedKey = this.decodeUnicodeString(key);
          decoded[decodedKey] = this.decodeUnicodeInObject(obj[key]);
        }
      }
      return decoded;
    }
    
    return obj;
  }
}