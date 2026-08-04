import codecs
import re
import time
from deep_translator import GoogleTranslator

def translate_file(input_file, output_file):
    with codecs.open(input_file, 'r', 'utf-8') as f:
        lines = f.readlines()

    translator = GoogleTranslator(source='en', target='zh-CN')
    out_lines = []
    
    # Regex to capture string values in JS object
    # Matches: prefix, quote, text, quote, suffix
    pattern = re.compile(r'^(.*?:\s*)(["\'])(.*?)\2(.*)$')
    
    translated_count = 0
    for line in lines:
        match = pattern.match(line)
        if match:
            prefix = match.group(1)
            quote = match.group(2)
            text = match.group(3)
            suffix = match.group(4)
            
            # Don't translate empty strings or pure numbers/symbols if any
            if text.strip() != "" and not text.isascii() or any(c.isalpha() for c in text):
                # Handle placeholders like {count} or simple English text
                try:
                    # Small delay to prevent rate limiting
                    if translated_count > 0 and translated_count % 100 == 0:
                        time.sleep(1)
                        
                    # Temporarily replace {count} with a placeholder that doesn't get translated
                    temp_text = text.replace('{count}', 'XYZ123')
                    
                    translated = translator.translate(temp_text)
                    if translated:
                        translated = translated.replace('XYZ123', '{count}')
                        # Escape quotes if necessary
                        if quote == '"':
                            translated = translated.replace('"', '\\"')
                        elif quote == "'":
                            translated = translated.replace("'", "\\'")
                        
                        out_line = f"{prefix}{quote}{translated}{quote}{suffix}\n"
                        out_lines.append(out_line)
                        translated_count += 1
                        continue
                except Exception as e:
                    print(f"Error translating: {text} - {e}")
                    
        out_lines.append(line)
        
    with codecs.open(output_file, 'w', 'utf-8') as f:
        f.writelines(out_lines)
        
    print(f"Translation complete! Translated {translated_count} strings.")

if __name__ == "__main__":
    translate_file('Client/src/i18n/locales/en.js', 'Client/src/i18n/locales/zh.js')
