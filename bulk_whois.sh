DOMAINS="mubo puxo qaro feni lami vazi goza yoba foku meva nira cova rozi feli kina mazo gavo cuvi limo jevi nezo wazo bivo zemi dulo vano tufa gujo muxe viyo gexi jilo luza bofi hazo qova weba noba kulo xeno meza fizo wixo buxo cuqi qazi xova duvo zejo toxo mufu juyo cexa ruqo buba juxi qivu meqo feka reji gizu cufa doxa vuzi zoba fepo huqi juvo kawa qexo veju wuza xami yuvo zeqi biqo cuxa dizo foji guxu hiza keju luxo moqi nuzu peja qixo ruza suyu toqo vexa wizu yako zuwu baxo cefo duqi fewu goxi huza jeco kixu lefa mizo nuqo pexi quza siwu teve weqi xuzu yefa zixo boxa cujo dexa fowa huxu jiqo kuza mefi noxu piza quwu raxo"
count=0
for d in $DOMAINS; do
  result=$(whois $d.co | grep -i -E "No match for|NOT FOUND")
  if [ ! -z "$result" ]; then
    echo "AVAILABLE: $d.co"
    count=$((count+1))
  fi
  if [ $count -ge 55 ]; then
    break
  fi
  sleep 0.1
done
echo "Total found: $count"
