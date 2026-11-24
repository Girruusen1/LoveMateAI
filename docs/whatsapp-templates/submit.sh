#!/usr/bin/env bash
# Submits the LoveMate WhatsApp templates in this folder to Meta for review.
#
#   WABA_ID=1234567890 WHATSAPP_ACCESS_TOKEN=EAAG... bash docs/whatsapp-templates/submit.sh
#
# WABA_ID is the WhatsApp Business Account id (WhatsApp Manager -> Account tools, or the
# number in the WhatsApp Manager URL). The token needs the whatsapp_business_management
# permission (a System User token from Meta Business Settings). Nothing here is stored.
#
# Each file is one template language. Submitting the same name twice with another
# language adds that language to the same template. Review usually takes minutes to a day;
# status shows in WhatsApp Manager -> Message templates, or with:
#   curl -s "https://graph.facebook.com/v21.0/$WABA_ID/message_templates?name=lovemate_intro_v1" -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
set -euo pipefail
: "${WABA_ID:?set WABA_ID}"
: "${WHATSAPP_ACCESS_TOKEN:?set WHATSAPP_ACCESS_TOKEN}"
DIR="$(cd "$(dirname "$0")" && pwd)"
for f in "$DIR"/*.json; do
  echo "== $(basename "$f")"
  curl -sS -X POST "https://graph.facebook.com/v21.0/$WABA_ID/message_templates" \
    -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    --data-binary @"$f"
  echo
done
