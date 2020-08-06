#1.	返回拥有员工的部门名、部门号。：emp和dept关联查询，内连接
SELECT DISTINCT d.dname, d.deptno FROM emp e, dept d WHERE e.deptno = d.deptno;

#2.	工资多于smith的员工信息：子查询
#select sal from emp where ename = 'SMITH';
SELECT * FROM emp WHERE sal > (SELECT sal FROM emp WHERE ename = 'SMITH');

#3.	返回员工和所属经理的姓名：自己和自己进行关联查询
SELECT emp1.ename, emp2.ename FROM emp emp1, emp emp2 WHERE emp1.mgr = emp2.empno;

#4.	返回雇员的雇佣日期早于其经理雇佣日期的员工及其经理姓名
SELECT emp1.ename, emp2.ename FROM emp emp1, emp emp2 WHERE emp1.mgr = emp2.empno AND emp1.hiredate < emp2.hiredate;

#5.	返回员工姓名及其所在的部门名称。
SELECT e.ename, d.dname FROM emp e, dept d WHERE e.deptno = d.deptno;

#6.	返回从事clerk工作的员工姓名和所在部门名称。
SELECT e.ename, d.dname FROM emp e, dept d WHERE e.deptno = d.deptno AND e.job = 'CLERK';

#7.	返回部门号及其本部门的最低工资。
SELECT deptno, MIN(sal) FROM emp GROUP BY deptno;

#8.	返回销售部(sales)所有员工的姓名。
SELECT e.ename FROM emp e, dept d WHERE e.deptno = d.deptno AND d.dname = 'SALES';
SELECT ename FROM emp WHERE deptno = (SELECT deptno FROM dept WHERE dname = 'sales');

#9.	返回工资水平多于平均工资的员工。
#select avg(sal) from emp;
SELECT * FROM emp WHERE sal > (SELECT AVG(sal) FROM emp);

#10.	返回与SCOTT从事相同工作的员工。
#select job from emp where ename = 'SCOTT';
SELECT * FROM emp WHERE job = (SELECT job FROM emp WHERE ename = 'SCOTT');

#11.	返回与30部门员工工资水平相同的员工姓名与工资。
#select sal from emp where deptno = 30;
SELECT * FROM emp WHERE sal IN (SELECT sal FROM emp WHERE deptno = 30)

#12.	返回工资高于30部门所有员工工资水平的员工信息。	
SELECT * FROM emp WHERE sal > (SELECT MAX(sal) FROM emp WHERE deptno = 30);

#13.	返回部门号、部门名、部门所在位置及其每个部门的员工总数。
SELECT d.deptno, d.dname, d.loc, COUNT(*) FROM dept d, emp e WHERE d.deptno = e.deptno GROUP BY d.deptno,d.dname, d.loc;

#14.	返回员工的姓名、所在部门名及其工资。
SELECT e.ename, d.dname, e.sal FROM emp e, dept d WHERE e.deptno = d.deptno;

#15.	返回员工的详细信息。(包括部门名)
SELECT e.*, d.dname FROM emp e, dept d WHERE e.deptno = d.deptno;

#16.	返回所有工作及其从事此工作的最低工资。
SELECT  job, MIN(sal)  FROM emp GROUP BY job;

#17.	计算出员工的年薪，并且以年薪排序。
SELECT ename, sal*12 FROM emp ORDER BY sal*12 DESC;


#emp和salgrade基本关联，查询全部
SELECT * FROM emp e, salgrade sg WHERE e.sal>=sg.losal AND e.sal<=sg.hisal;


#18.	返回工资处于第四级别的员工的姓名:  emp表和salgrade表关联查询
SELECT * FROM emp e, salgrade sg WHERE e.sal>=sg.losal AND e.sal<=sg.hisal AND sg.grade = 4;


#19.	返回工资为二等级的职员名字、工资、部门名称、和二等级的最低工资和最高工资
SELECT e.ename, e.sal, d.dname, sg.losal, sg.hisal FROM emp e, salgrade sg, dept d WHERE e.sal>=sg.losal AND e.sal<=sg.hisal AND e.deptno=d.deptno AND sg.grade = 2;


#20.	工资等级多于smith的员工信息。
#查询smith的工资等级
SELECT sg.grade FROM emp e, salgrade sg WHERE e.sal>=sg.losal AND e.sal<=sg.hisal AND e.ename = 'SMITH';
#查询工资等级大于1的员工信息
SELECT * FROM emp e, salgrade sg WHERE e.sal>=sg.losal AND e.sal<=sg.hisal AND sg.grade > 1;

#合并成一条sql
SELECT * FROM emp e, salgrade sg WHERE e.sal>=sg.losal AND e.sal<=sg.hisal AND sg.grade > (SELECT sg.grade FROM emp e, salgrade sg WHERE e.sal>=sg.losal AND e.sal<=sg.hisal AND e.ename = 'SMITH');