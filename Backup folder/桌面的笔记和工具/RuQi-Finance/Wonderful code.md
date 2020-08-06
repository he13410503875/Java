# Map集合练习

需求：

计算一个字符串中每个字符出现的次数。

分析：

1. 获取一个字符串对象
2. 创建一个Map集合，键代表字符，值代表次数。
3. 遍历字符串得到每个字符。
4. 判断Map中是否有该键。
5. 如果没有，第一次出现，存储次数为1；如果有，则说明已经出现过，获取到对应的值进行++，再次存储。     
6. 打印最终结果

代码：

    public class MapTest {
    	public static void main(String[] args) {
            findChar("xxnioowo");
        }
        
        private static void findChar(String line) {
            //1:创建一个集合 存储  字符 以及其出现的次数
            HashMap<Character, Integer> map = new HashMap<Character, Integer>();
            
            //2:遍历字符串,得到组成的每一个字符,进行判断
            for (int i = 0; i < line.length(); i++) {
                char c = line.charAt(i);//x
                
                //判断 该字符 是否在键集中
                if (!map.containsKey(c)) {//说明这个字符没有出现过
                    //那就是第一次
                    map.put(c, 1);//x:1;
                } else {
                    //先获取之前的次数
                    Integer count = map.get(c);//1
                    //count++;
                    //再次存入  更新
                    map.put(c, ++count);//x:2;
                }
            }
            
            System.out.println(map);
        }
    }



## 案例需求分析

1. 准备牌：

完成数字与纸牌的映射关系：

使用双列Map(HashMap)集合，完成一个数字与字符串纸牌的对应关系(相当于一个字典)。

1. 洗牌：

通过数字完成洗牌发牌

1. 发牌：

将每个人以及底牌设计为ArrayList<String>,将最后3张牌直接存放于底牌，剩余牌通过对3取模依次发牌。

存放的过程中要求数字大小与斗地主规则的大小对应。

将代表不同纸牌的数字分配给不同的玩家与底牌。

1. 看牌：

通过Map集合找到对应字符展示。

通过查询纸牌与数字的对应关系，由数字转成纸牌字符串再进行展示。

![](Java%E5%9F%BA%E7%A1%80%E7%8F%ADNo.02-days/day04%20%E3%80%90Map%E3%80%91/%E8%AE%B2%E4%B9%89/img/%E6%96%97%E5%9C%B0%E4%B8%BB%E5%88%86%E6%9E%90.png)

3.3  实现代码步骤

    public class Poker {
         public static void main(String[] args) {
            //键和值绑定,编号思想,为每一张牌绑定一个编号,0编号对应的最大的牌,1,次大牌,对应关系搞出来,编号键绑定牌值
            HashMap<Integer,String> hm  = new HashMap<>();//空
    
            //大王小王最大,最简单,绑定编号
            int count = 0;//开始编号
            hm.put(count++,"大王");//0
            hm.put(count++,"小王");//1
            //2,♠2,3,♥2
    
            //造牌,♠2,花色单列集合,数字单列集合,拼接成牌
            ArrayList<String> color = new ArrayList<>();//
            ArrayList<String> num = new ArrayList<>();
                             //集合, 指定的元素
            Collections.addAll(color, "♠", "♥", "♣", "♦");
            Collections.addAll(num, "2", "A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3");
            //拼接,拿到数字,遍历花色,有序,从大到小,不清楚,各自打印
            for (String n : num) {
                //n:2", "A", "K", "Q", "J",
                for (String c : color) {
                    hm.put(count++,c+n);//1
                }
            }
    
            System.out.println(hm);//通过键找到值,绑定了
    
            //洗牌,洗编号,因为编号键绑定牌值,通过编号可以找到牌,集合工具类,随机置换,要求用的list集合,键的集合编号集合
            Set<Integer> keyset = hm.keySet();
            ArrayList<Integer> numberList = new ArrayList<Integer>();
            numberList.addAll(keyset);//numberList编号集合在这里了
            Collections.shuffle(numberList);//打乱了,所有编号
    
            //发牌,发编号,按照一定的条件来发,因为编号键绑定牌值,通过编号可以找到牌
            //编号集合,每一个人都有一个,三个玩家,底牌
            ArrayList<Integer> one = new ArrayList<>();//部分编号
            ArrayList<Integer> two = new ArrayList<>();
            ArrayList<Integer> three = new ArrayList<>();
            ArrayList<Integer> last = new ArrayList<>();
    
            for (int i = 0; i < numberList.size(); i++) {
                Integer pernum = numberList.get(i);//总的编号集合,每一个编号,根据编号集合的索引来分配
    
                if (i>=51){
                    last.add(pernum);//每一个人,拿到自己编号集合,但是里面编号不是排序好,打乱的
                }else {
                    if (i%3==0){
                        one.add(pernum);
                    }else if (i%3==1){
                        two.add(pernum);
                    }else {
                        three.add(pernum);
                    }
                }
    
            }
    
            //每一个人编号集合里面编号有序,牌就有序,因为编号键绑定牌值,工具类
            Collections.sort(one);//0,1..
            Collections.sort(two);
            Collections.sort(three);
            Collections.sort(last);
    
            //编号排好序,编号键绑定牌值,每一个编号找到每一个张牌,存到各种牌集合里面,玩家牌集合,...牌集合存储牌
            ArrayList<String> player1 = new ArrayList<String>();//玩家1牌集合,空的,通过编号找到牌
            ArrayList<String> player2 = new ArrayList<String>();
            ArrayList<String> player3 = new ArrayList<String>();
            ArrayList<String> dipai = new ArrayList<String>();
    
    
            for (Integer o : one) {
                String p = hm.get(o);//每一个编号找到每一个张牌,编号 拍好序,牌,排好,绑定
                player1.add(p);
            }
    
            for (Integer o : two) {
                String p = hm.get(o);//每一个编号找到每一个张牌,
                player2.add(p);
            }
    
            for (Integer o : three) {
                String p = hm.get(o);//每一个编号找到每一个张牌,
                player3.add(p);
            }
    
            for (Integer o : last) {
                String p = hm.get(o);//每一个编号找到每一个张牌,
                dipai.add(p);
            }
    
            //看牌,打印集合
            System.out.println("令狐冲："+player1);
            System.out.println("石破天："+player2);
            System.out.println("鸠摩智："+player3);
            System.out.println("底牌："+dipai);
        }
    }


​    









