DOMAINS="vubix qimex muxel vuzaq fexul rozik gexin quvan zixol vezoq kujev nuxel xumor vozar wuxel jixan zeqol quzix bexor vuzik pexan yuzel xovan jaxel moxen wuzan zexal puqar fuxel yozik xozan juqer zuxen xoqar yuxel vuqel puzan feqox luxer yexan ziqaq xozen vuqan zezaq nuxan qexel woqel yuxar quzex yozan yiqex muqex luxen buqax xoqer yuqel xoqax yiqax yexen xoqaz yozun puzen xuzen wuqar woqen puqax yuqax"
count=0
for d in $DOMAINS; do
  result=$(whois $d.co | grep -i -E "No match for|NOT FOUND")
  if [ ! -z "$result" ]; then
    echo "AVAILABLE: $d.co"
    count=$((count+1))
  fi
  if [ $count -ge 15 ]; then
    break
  fi
  sleep 0.1
done
echo "Total found: $count"
